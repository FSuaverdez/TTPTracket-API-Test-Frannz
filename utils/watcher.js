const twilio = require("twilio");

const accountSid = process.env.TWILIO_SID; // Your Account SID from www.twilio.com/console
const authToken = process.env.TWILIO_TOKEN;

const client = require("twilio")(accountSid, authToken);

const axios = require("axios").default;
const { difference } = require("lodash");
const Subscriber = require("../models/Subscriber");
const { sendSMS } = require("./twilio");
const moment = require("moment");
const { performance } = require("perf_hooks");
let subscription;

//watcher
const watcher = async () => {
  let prev = null;
  let allSlots = null;

  if (subscription) {
    subscription = clearInterval(subscription);
    console.log("Restarting Watcher");
  } else {
    console.log("Starting Watcher");
  }

  try {
    subscription = setInterval(async () => {
      const subscribers = await Subscriber.find({ status: "active" }).lean();

      let tempLocations = subscribers.map((subscriber) => subscriber.locations);

      let locations = [];

      tempLocations.forEach((sl) => {
        sl.forEach((location) => {
          locations.push(location);
        });
      });

      locations = locations.filter(
        (value, index, self) =>
          index === self.findIndex((t) => t.locationId === value.locationId)
      );

      let result = [];
      result = await Promise.all(
        locations?.map(async (location) => {
          try {
            const data = await getSlots(location);
            if (data == false) {
              crash = true;
              return [];
            }
            return data == false ? [] : data;
          } catch (e) {
            crash = true;
            return [];
          }
        })
      );

      let temp = [];

      result.forEach((r) => {
        try {
          temp.push(...r);
        } catch (err) {}
      });

      allSlots = temp;

      if (!prev) {
        prev = allSlots;
      }
      console.log(
        new Date().toLocaleTimeString(),
        allSlots?.length,
        prev?.length
      );

      if (getDifference(allSlots, prev).length > 0) {
        let newSlots = getDifference(allSlots, prev);

        prev = allSlots;

        newSlots = newSlots.reduce((acc, cur) => {
          let curDate = new Date(cur.startTimestamp);
          let curDateStr =
            curDate.getFullYear() +
            "-" +
            (curDate.getMonth() + 1) +
            "-" +
            curDate.getDate();
          let existDateObj = acc.find((f) => f.dStr === curDateStr);
          if (existDateObj) {
            let existDate = new Date(existDateObj.date);
            if (curDate.getTime() > existDate.getTime()) {
              acc = acc.filter((f) => f.id !== existDateObj.id);
              acc.push(Object.assign(cur, { dStr: curDateStr }));
            }
          } else {
            acc.push(Object.assign(cur, { dStr: curDateStr }));
          }

          return acc;
        }, []);

        console.log(`New Slots: ${newSlots.length}`);

        const startTime = performance.now();

        await Promise.all(
          newSlots.map(async (slot) => {
            const subscribers = await Subscriber.find({
              "locations.locationId": slot.locationId,
            }).lean();

            const phoneNumbers = subscribers.map(
              (subscriber) => subscriber.phoneNumber
            );
            console.log({ ...slot, phoneNumbers });

            await Promise.all(
              subscribers.map(async (s) => {
                const isValid = await checkSubscriberValidity(s, slot);

                if (!isValid) {
                  return;
                }

                let nextDay = s?.nextDay;
                if (!nextDay) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  nextDay = new Date(tomorrow);
                  await Subscriber.findByIdAndUpdate(s._id, {
                    nextDay: new Date(tomorrow),
                  });
                }

                if (new Date(nextDay) <= new Date()) {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  nextDay = new Date(tomorrow);
                  await Subscriber.findByIdAndUpdate(s._id, {
                    nextDay: new Date(tomorrow),
                    remainingText: 30,
                  });
                }

                if (Number(s?.remainingText) <= 0) {
                  return;
                }

                const updated = await Subscriber.findById(s._id);
                await Subscriber.findByIdAndUpdate(s._id, {
                  remainingText: updated?.remainingText - 1,
                });

                let location = "ttp.cbp.dhs.gov";
                switch (s.locationType) {
                  case "global":
                    location = "ttp.cbp.dhs.gov";
                    break;
                  case "sentri":
                    location = "ttp.cbp.dhs.gov";
                    break;
                  case "nexus":
                    location = "ttp.cbp.dhs.gov";
                    break;
                }

                // if (!s?.carrier) {
                //   try {
                //     console.log("Checking for carrier of " + s?.phoneNumber);
                //     const checkNumberResponse = await client.lookups.v1
                //       .phoneNumbers(s?.phoneNumber)
                //       .fetch({ type: ["carrier"] });

                //     await Subscriber.findByIdAndUpdate(s?._id, {
                //       carrier: checkNumberResponse.carrier.name,
                //     });
                //     s.carrier = checkNumberResponse.carrier.name;
                //   } catch (error) {}
                // }

                const bookLink =
                  s?.carrier !== "AT&T Wireless"
                    ? `Schedule: ${location}. `
                    : "";

                const message = `New Appt at "${slot?.name}" on ${moment(
                  slot?.startTimestamp
                ).format(
                  "dddd, MMMM DD, YYYY @ h:mm A"
                )}.\n${bookLink}"STOP" to end alerts `;

                const response = await sendSMS(
                  s.phoneNumber,
                  message,
                  s?.assignedNumber,
                  s
                );

                if (response) {
                  console.log(
                    new Date().toLocaleTimeString(),
                    " SMS SENT :",
                    response
                  );
                }

                // const newCredit = s.credit - 0.0079;
                // if (newCredit < 0.0079) {
                //   await Subscriber.findByIdAndUpdate(
                //     s._id,
                //     { credit: newCredit, status: "inactive" },
                //     { new: true }
                //   );
                // } else {
                //   await Subscriber.findByIdAndUpdate(
                //     s._id,
                //     { credit: newCredit },
                //     { new: true }
                //   );
                // }
              })
            );
          })
        );

        const endTime = performance.now();
        console.log(
          `Done. Took ${Math.round(endTime - startTime)} milliseconds`
        );
      } else {
        prev = allSlots;
      }
    }, 1000 * 5);
  } catch (e) {
    console.log(e);
  }
};

const getSlots = async (location) => {
  try {
    const getSlotUrl = (id) =>
      `https://ttp.cbp.dhs.gov/schedulerapi/slots?orderBy=soonest&limit=11&locationId=${id}&minimum=0`;

    const { data } = await axios.get(getSlotUrl(location.locationId));

    const newData = data.map((d) => ({ ...location, ...d }));

    return newData;
  } catch (e) {
    // console.log(e);
    console.log(new Date().toLocaleTimeString(), " Failed to fetch");
    return false;
  }
};

function getDifference(array1, array2) {
  return array1.filter((object1) => {
    return !array2.some((object2) => {
      return object1.startTimestamp === object2.startTimestamp;
    });
  });
}

async function unsubCourier(marketing, id) {
  try {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.COURIER_TOKEN}`,
      },
    };
    const data = [
      {
        op: "replace",
        path: "/custom",
        value: {
          marketing: marketing,
          subscribed: false,
        },
      },
    ];
    await axios.patch(
      `https://api.courier.com/profiles/${id}`,
      {
        patch: data,
      },
      config
    );
  } catch (error) {
    console.log(error);
  }
}

const checkSubscriberValidity = async (s, slot) => {
  let valid = true;
  if (s.status === "inactive") {
    await unsubCourier(s.marketing, s.courierId);
    valid = false;
  }
  if (new Date() > new Date(s.endDate)) {
    await Subscriber.findByIdAndUpdate(
      s._id,
      { status: "inactive" },
      { new: true }
    );
    await unsubCourier(s.marketing, s.courierId);
    valid = false;
  }
  // if (s.credit < 0.0079) {
  //   await Subscriber.findByIdAndUpdate(
  //     s._id,
  //     { status: "inactive" },
  //     { new: true }
  //   );
  //   await unsubCourier(s.marketing, s.courierId);
  //   valid = false;
  // }

  if (s?.hasMaxDate) {
    if (new Date(s?.maxCheckDate) < new Date(slot.startTimestamp)) {
      valid = false;
    }
  }

  const day = moment(slot.startTimestamp).format("ddd").toUpperCase();
  if (s?.checkDays) {
    if (s?.selectedDays?.length) {
      if (!s.selectedDays?.includes(day)) {
        valid = false;
      }
    }
  }

  if (!s.receiveUpdate) {
    valid = false;
  }

  return valid;
};

module.exports = watcher;
