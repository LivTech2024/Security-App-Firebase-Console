import { compressAndConvertImages } from './utils';
import puppeteer from 'puppeteer';

export const generatePdfFromHtml = async (html: string) => {
  let browser;

  // Set timeout to 5 minutes
  const timeout = 5 * 60 * 1000;

  try {
    const formattedHtml = await compressAndConvertImages(html);

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
      headless: true,
    });

    const page = await browser.newPage();

    page.setDefaultTimeout(timeout);

    await page.setContent(formattedHtml, {
      waitUntil: 'networkidle0',
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error('Error during PDF generation process:', error);
    browser?.close();
    return null;
  }
};
