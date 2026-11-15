import deployment from "./deploy/vercel-config.cjs";

// This executes only in Vercel's configuration phase. The backend origin is public;
// database, Cloudinary, Brevo and Stripe secrets belong only on the Render backend.
export const config = deployment.createVercelConfig(process.env.STAY_BACKEND_ORIGIN);
