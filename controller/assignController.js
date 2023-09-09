const Subscriber = require("../models/Subscriber");
const { numbers } = require("../utils/numbers");

exports.assignNumbersToAll = async (req, res) => {
  try {
    const subscribers = await Subscriber.find();

    let index = 0;

    for (const sub of subscribers) {
      await Subscriber.findByIdAndUpdate(sub._id, {
        assignedNumber: numbers[index],
        receiveUpdate: sub?.receiveUpdate,
      });

      if (index + 1 === numbers.length) {
        index = 0;
      } else {
        index++;
      }
    }

    res.status(200).json(subscribers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.findLatest = async (req, res) => {
  try {
    const latest = await Subscriber.findOne().sort({ _id: -1 });

    let index = numbers.indexOf(latest.assignedNumber);

    if (index + 1 === numbers.length) {
      index = 0;
    } else {
      index++;
    }

    const nextNumber = numbers[index];
    console.log(nextNumber);

    res.status(200).json(latest);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAssignedNumber = async () => {
  try {
    const latest = await Subscriber.findOne().sort({ _id: -1 });

    let index = numbers.indexOf(latest.assignedNumber);

    if (index + 1 === numbers.length) {
      index = 0;
    } else {
      index++;
    }

    const nextNumber = numbers[index];
    return nextNumber;
  } catch (error) {
    console.log(error);
  }
};

exports.correctEndDate = async (req, res) => {
  try {
    const subscribers = await Subscriber.find();

    subscribers.forEach(async (sub) => {
      await Subscriber.findByIdAndUpdate(sub._id, {
        endDate: new Date(
          new Date(sub.createdAt).setDate(
            new Date(sub.createdAt).getDate() + 30
          )
        ),
      });
    });
    const updated = await Subscriber.find();
    res.status(200).json({ subscribers: updated });
  } catch (error) {
    console.log(error);
  }
};
const disabled = [
  "1978828",
  "1978590",
  "1970222",
  "1949537",
  "1949412",
  "1904662",
  "1862324",
  "1858342",
  "1832837",
  "1832496",
  "1816372",
  "1801557",
  "1703402",
  "1702373",
  "1617592",
  "1603395",
  "1601347",
  "1585748",
  "1530908",
  "1479381",
  "1443226",
  "1415706",
  "1412418",
  "1410259",
  "1337207",
  "1314650",
  "1310435",
  "1240731",
  "1206495",
  "1206419",
  "1202766",
  "1202709",
  "1202246",
  "1202210",
];

exports.updateStatus = async (req, res) => {
  try {
    const exclude = await Promise.all(
      disabled.map(async (num) => {
        let sub = await Subscriber.findOne({
          phoneNumber: { $regex: num, $options: "i" },
        });

        return sub?._id?.toString();
      })
    );

    const all = await Subscriber.find();

    const toUpdate = all.filter((sub) => !exclude.includes(sub._id.toString()));

    const updated = await Promise.all(
      toUpdate.map(async (sub) => {
        sub = await Subscriber.findByIdAndUpdate(sub._id, {
          status: "active",
        });

        return sub;
      })
    );
    res.status(200).json({ subscribers: updated });
  } catch (error) {
    console.log(error);
  }
};
