const mongoose = require("mongoose");
const env = require("./env");

mongoose.set("strictQuery", true);

// async function connectDB(mongoStatus, mongoOperationDuration, mongoOperationsTotal, mongoErrorsTotal) {
//   const conn = await mongoose.connect(env.mongoUri, {
//     serverSelectionTimeoutMS: 10_000,
//   });

//   await mongoose.connection.db.admin().ping();
//   mongoStatus.set(1);

//   mongoose.connection.on("commandSucceeded", (event) => {
//     mongoOperationsTotal.inc({
//       operation: event.commandName,
//     });

//     mongoOperationDuration.observe(
//       {
//         operation: event.commandName,
//       },
//       event.duration / 1000
//     );
//   });

//   // mongoose.connection.on("commandFailed", (event) => {
//   //   mongoErrorsTotal.inc({
//   //     operation: event.commandName,
//   //   });
//   // });

//   console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

//   mongoose.connection.on("error", (err) => {
//     console.error("MongoDB error:", err.message);
//     mongoStatus.set(0);

//     mongoErrorsTotal.inc({
//       operation: "connection"
//     });

//     console.error(
//       "MongoDB error:",
//       err.message
//     );
//   });
//   mongoose.connection.on("disconnected", () => {
//     console.warn("MongoDB disconnected");
//   });
// }

// module.exports = { connectDB };

async function connectDB(
  mongoStatus,
  mongoOperationDuration,
  mongoOperationsTotal,
  mongoErrorsTotal
) {

  try {

    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10_000,
      monitorCommands: true,
    });

    await mongoose.connection.db.admin().ping();

    mongoStatus.set(1);

    const mongoClient = mongoose.connection.getClient();

    mongoClient.on("commandSucceeded", (event) => {

      mongoOperationsTotal.inc({
        operation: event.commandName,
      });

      mongoOperationDuration.observe(
        {
          operation: event.commandName,
        },
        event.duration / 1000
      );

    });
    mongoClient.on("commandFailed", (event) => {

      mongoErrorsTotal.inc({
        operation: event.commandName,
      });

      console.error(
        `MongoDB command failed: ${event.commandName}`
      );

    });

    mongoose.connection.on("error", (err) => {

      mongoStatus.set(0);

      mongoErrorsTotal.inc({
        operation: "connection",
      });

      console.error(
        "MongoDB error:",
        err.message
      );

    });

    mongoose.connection.on("disconnected", () => {

      mongoStatus.set(0);

      console.warn("MongoDB disconnected");

    });


    console.log(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`
    );

    return conn;

  } catch (error) {

    mongoStatus.set(0);

    mongoErrorsTotal.inc({
      operation: "connection",
    });

    console.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
}

module.exports = { connectDB };
