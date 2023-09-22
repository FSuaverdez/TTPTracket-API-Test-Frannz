const Subscriber = require("../models/Subscriber");
const { numbers } = require("../utils/numbers");
const { getSecurityKey } = require("../services/generate-key");
exports.assignNumbersToAll = async (req, res) => {
  try {
    const subscribers = await Subscriber.find();

    let index = 0;

    for (const sub of subscribers) {
      await Subscriber.findByIdAndUpdate(sub._id, {
        assignedNumber: numbers[index],
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

    if (index == -1) {
      index == 0;
    }

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

exports.assignKeyToAll = async (req, res) => {
  try {
    const subscribers = await Subscriber.find();

    // iterate through all subscribers and check if they have a secret key if not generate one and assign it to them
    for (const sub of subscribers) {
      if (!sub.secretKey) {
        const key = await getSecurityKey();
        await Subscriber.findByIdAndUpdate(sub._id, {
          secretKey: key,
        });
      }
    }
    const updatedSubscribers = await Subscriber.find();
    res.status(200).json(updatedSubscribers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
