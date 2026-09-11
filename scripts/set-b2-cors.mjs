import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const b2 = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: process.env.B2_REGION,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});

await b2.send(new PutBucketCorsCommand({
  Bucket: process.env.B2_BUCKET_NAME,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: ["http://localhost:3000", "https://questuslog.lol"],
        AllowedMethods: ["GET", "PUT"],
        AllowedHeaders: ["*"],
        MaxAgeSeconds: 3600,
      },
    ],
  },
}));

console.log("CORS rules set successfully");
