const bcrypt = require("bcryptjs");
const User = require("../models/userModel");

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const toBoolean = (value) => String(value || "").trim().toLowerCase() === "true";

const ensureAdminUser = async () => {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  const adminPassword = String(process.env.ADMIN_PASSWORD || "");
  const syncPasswordOnStart = toBoolean(process.env.ADMIN_SYNC_PASSWORD);

  if (!adminEmail || !adminPassword) {
    console.warn("ADMIN_EMAIL or ADMIN_PASSWORD is missing. Admin seed skipped.");
    return;
  }

  const existingUser = await User.findOne({ email: adminEmail });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await User.create({
      email: adminEmail,
      password: hashedPassword,
      userType: "admin",
      isVerified: true,
      emailVerification: {
        otpHash: null,
        expiresAt: null,
        verifiedAt: new Date()
      },
      passwordReset: {
        otpHash: null,
        expiresAt: null,
        verifiedAt: null
      }
    });
    console.log(`Admin account created: ${adminEmail}`);
    return;
  }

  if (existingUser.userType !== "admin") {
    console.warn(
      `${adminEmail} already exists with userType '${existingUser.userType}'. Admin seed skipped.`
    );
    return;
  }

  if (syncPasswordOnStart) {
    existingUser.password = await bcrypt.hash(adminPassword, 10);
    existingUser.isVerified = true;
    existingUser.emailVerification = {
      otpHash: null,
      expiresAt: null,
      verifiedAt: new Date()
    };
    await existingUser.save();
    console.log(`Admin password synced for: ${adminEmail}`);
    return;
  }

  console.log(`Admin account already exists: ${adminEmail}`);
};

module.exports = ensureAdminUser;
