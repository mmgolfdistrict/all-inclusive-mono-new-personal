/**
 * Interface representing the response from Google's reCAPTCHA verification.
 */
interface IGoogleCaptchaResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  apk_package_name?: string;
  "error-codes"?: string[];
}

/**
 * Verifies the user's response to a Google reCAPTCHA challenge.
 *
 * This function sends a POST request to Google's reCAPTCHA API to ensure that
 * the provided CAPTCHA token is valid. It is essential to verify the CAPTCHA
 * response on the server-side to prevent abuse and ensure the authenticity of
 * the user's interaction.
 *
 * @param captchaToken - The reCAPTCHA token response from the client-side.
 *
 * @returns A Promise that resolves to `true` if the CAPTCHA verification was successful,
 * and `false` otherwise.
 *
 * @throws Will throw an error if there's any issue with the verification request.
 */
export const verifyCaptcha = async (captchaToken: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
      {
        method: "POST",
      }
    );
    const data: IGoogleCaptchaResponse = (await response.json()) as IGoogleCaptchaResponse;

    return data.success;
  } catch (error) {
    console.error(error);
    return false;
  }
};
