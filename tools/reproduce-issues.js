import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { User } from '../server/src/models/User.js';
import { Otp } from '../server/src/models/Otp.js';

const timeout = setTimeout(() => {
  console.error('Reproduction timed out');
  process.exit(1);
}, 30000);

async function main() {
  console.log('--- REPRODUCING REAL BUGS ---');
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = replSet.getUri();
  await mongoose.connect(uri);

  // 1b. Test Registration with: name "charan  gffff", DOB "1940-04-05" (or "05/04/1940"), phone "+918888888888" (or "88888 88888")
  console.log('\n--- 1b. Testing Register Bug ---');
  const regPayload1 = {
    name: 'charan  gffff',
    dateOfBirth: '1940-04-05',
    phone: '+918888888888',
    nationality: 'Indian'
  };
  const regRes1 = await request(app).post('/api/auth/register').send(regPayload1);
  console.log('Payload 1 (ISO date):', regRes1.status, JSON.stringify(regRes1.body));

  const regPayload2 = {
    name: 'charan  gffff',
    dateOfBirth: '05/04/1940',
    phone: '88888 88888',
    nationality: 'Indian'
  };
  const regRes2 = await request(app).post('/api/auth/register').send(regPayload2);
  console.log('Payload 2 (Indian format date & raw phone):', regRes2.status, JSON.stringify(regRes2.body));

  // What if DOB year 1940 fails the year limit in client DateOfBirthInput?
  // Let's check client DateOfBirthInput minYear: today.year - 100 = 2026 - 100 = 1926.
  // What if client Register sends dateOfBirth: '05/04/1940' because parsePastedDate was used or DD/MM/YYYY was entered?

  // 1a. Test OTP Verification / Two Codes issue:
  console.log('\n--- 1a. Testing OTP Issue ---');
  // First register a user
  const regUser = await request(app).post('/api/auth/register').send({
    name: 'Test OTP User',
    dateOfBirth: '1995-05-05',
    phone: '+917777777777',
    nationality: 'Indian'
  });
  console.log('Register response:', regUser.status, JSON.stringify(regUser.body));
  const code1 = regUser.body.devOtp;

  // Now, what if the OTP screen requests another OTP?
  const reqOtp = await request(app).post('/api/auth/otp/request').send({
    phone: '+917777777777'
  });
  console.log('Request OTP response:', reqOtp.status, JSON.stringify(reqOtp.body));
  const code2 = reqOtp.body.devOtp;

  console.log(`Code 1 (from register): ${code1}, Code 2 (from requestOtp): ${code2}`);
  // If user enters Code 1 (from register banner):
  const verifyWithCode1 = await request(app).post('/api/auth/otp/verify').send({
    phone: '+917777777777',
    otp: code1
  });
  console.log('Verify with Code 1:', verifyWithCode1.status, JSON.stringify(verifyWithCode1.body));

  // 1c. Test earlier reports:
  console.log('\n--- 1c. Testing Earlier Reports (Set-PIN & Self-Transfer) ---');
  // Complete verification for user with code2:
  const verifyWithCode2 = await request(app).post('/api/auth/otp/verify').send({
    phone: '+917777777777',
    otp: code2
  });
  const tempToken = verifyWithCode2.body.tempToken;
  console.log('Verify with Code 2:', verifyWithCode2.status, 'tempToken:', !!tempToken);

  // Set-PIN with tempToken:
  const setPinRes = await request(app).post('/api/auth/pin')
    .set('Authorization', `Bearer ${tempToken}`)
    .send({ pin: '123456', confirmPin: '123456', userId: regUser.body.user.id });
  console.log('Set PIN result:', setPinRes.status, JSON.stringify(setPinRes.body));

  // What happens if Set-PIN is called a second time?
  const setPinRes2 = await request(app).post('/api/auth/pin')
    .set('Authorization', `Bearer ${tempToken}`)
    .send({ pin: '123456', confirmPin: '123456', userId: regUser.body.user.id });
  console.log('Set PIN second time:', setPinRes2.status, JSON.stringify(setPinRes2.body));

  // Self-transfer test:
  // Login user:
  const loginRes = await request(app).post('/api/auth/login').send({ phone: '+917777777777', pin: '123456' });
  const userToken = loginRes.body.accessToken;
  const userAcc = loginRes.body.user.accountNumber;
  console.log('User account:', userAcc, 'phone:', loginRes.body.user.phone);

  // Transfer to self by account:
  const selfByAcc = await request(app).post('/api/transfers')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ recipientAccount: userAcc, amountPaise: 50000, pin: '123456' });
  console.log('Self-transfer by account:', selfByAcc.status, JSON.stringify(selfByAcc.body));

  // Transfer to self by phone:
  const selfByPhone = await request(app).post('/api/transfers')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ recipientPhone: '+917777777777', amountPaise: 50000, pin: '123456' });
  console.log('Self-transfer by phone:', selfByPhone.status, JSON.stringify(selfByPhone.body));

  await mongoose.disconnect();
  await replSet.stop();
  clearTimeout(timeout);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal repro error:', err);
  clearTimeout(timeout);
  process.exit(1);
});
