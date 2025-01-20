# GOLFdistrict.

=======

Turbo monorepo contains all the components of the GOLFdistrict platform.
Please yank the latest code.

## Running the App

To run the GOLFdistrict platform, follow these steps:

**1. Install the necessary dependencies:**

```bash
npm install
```

**2. Use the provided scripts to manage different aspects of the application.**

### Scripts Explained

- **dev**: Starts the development server using Turbo.

- **build**: Builds the application using Turbo.

- **compile**: Compiles the application using Turbo.

- **test**: Runs tests for the application.

- **lint**: Lints the codebase for code quality and style issues.

- **format**: Formats code files (JS, JSX, TS, TSX, MD, CSS) using Prettier.

- **prettier-check**: Checks code files for Prettier formatting issues.

**3. Configure webhook for local development**

- Identify the services or APIs that require webhooks for local development.

- If using Ngrok for local development:

  - Install Ngrok by following the instructions on the official [Ngrok website](https://ngrok.com).

  - Obtain your Ngrok auth key from the Ngrok dashboard and set it as the value for NGROK_AUTH_KEY in your `.env` file.

  - Start Ngrok to expose your local server to the internet by running: `$ ngrok http 3000`

  - Ngrok will provide a public URL (e.g., https://your-ngrok-subdomain.ngrok.io). Use this URL as the webhook endpoint for services requiring a callback.

- Update the necessary configuration files or environment variables to point to your local server or Ngrok URL.

- Ensure that your webhooks are configured to use the Ngrok URL for local testing.

## Deploying The App

#### 1. Create or Navigate to Your Project on Vercel:

If you don't have a Vercel account, sign up at Vercel. Once logged in:

- Click on "New Project."

- Choose your Git repository containing the GOLFdistrict project.

- Select the apps/nextjs folder as the root directory. Vercel's zero-config system will automatically handle most configurations for you.

#### 2. Add Your Environment Variables to Vercel:

- In the Vercel Dashboard, navigate to your project.

- Go to "Settings" > "Environment Variables."

- Add the environment variables required for your application. These variables include sensitive information like API keys, database URLs, and other configuration settings.

- Ensure that the environment variables match those in your local development environment.

- An exhaustive list of required environment variables can be found in the [`.env`](.env.sample) file

#### 3. Deploy Your App:

Trigger the deployment process either manually by clicking "Deploy" in the Vercel Dashboard or connect your GitHub/GitLab/Bitbucket repository for automatic deployments.

#### 4. Monitor Deployment:

Monitor the deployment progress through the Vercel Dashboard. Detailed logs will be available in case of any issues.

#### 5. Access Your Deployed App:

Once the deployment is successful, Vercel will provide a unique URL for your application. Access your live GOLFdistrict platform using this URL.

#### 6. The End



