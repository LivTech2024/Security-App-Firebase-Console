import { compressAndConvertImages } from './utils';
import puppeteer from 'puppeteer';

export const generatePdfFromHtml = async (html: string) => {
  let browser;

  // Set timeout to 10 minutes
  const timeout = 10 * 60 * 1000;

  try {
    const formattedHtml = await compressAndConvertImages(html);

    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
      headless: true,
      defaultViewport: {
        width: 1280,
        height: 800,
      },
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(timeout);

    // Add CSS to prevent page breaks
    const styleTag = `
      <style>
        body {
          margin: 0;
          padding: 0;
        }
        * {
          page-break-before: avoid !important;
          page-break-after: avoid !important;
          page-break-inside: avoid !important;
        }
        table {
          page-break-inside: avoid !important;
        }
        tr {
          page-break-inside: avoid !important;
        }
        td {
          page-break-inside: avoid !important;
        }
        div {
          page-break-inside: avoid !important;
        }
      </style>
    `;
    await page.setContent(styleTag + formattedHtml, {
      waitUntil: 'networkidle0',
    });

    const scrollDimension = await page.evaluate(() => {
      const scrollingElement = document.scrollingElement;
      if (!scrollingElement) {
        throw new Error('scrollingElement is null');
      }
      return {
        width: scrollingElement.scrollWidth,
        height: scrollingElement.scrollHeight,
      };
    });

    await page.setViewport({
      width: scrollDimension.width,
      height: scrollDimension.height,
    });

    const pdfBuffer = await page.pdf({
      width: `${scrollDimension.width}px`,
      height: `${scrollDimension.height}px`,
      printBackground: true,
      pageRanges: '1',
    });

    await browser.close();

    return pdfBuffer;
  } catch (error) {
    console.error('Error during PDF generation process:', error);
    if (browser) {
      await browser.close();
    }
    return null;
  }
};
