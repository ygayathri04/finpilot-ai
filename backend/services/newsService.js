const { PDFParse } = require("pdf-parse");

const NSE_BASE_URL = "https://www.nseindia.com";

function cleanText(text = "") {
  return String(text)
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

function isPdfBuffer(buffer) {
  if (!buffer || buffer.length < 5) {
    return false;
  }

  // PDF files normally begin with %PDF-
  return buffer.subarray(0, 5).toString() === "%PDF-";
}

async function extractAttachmentText(url) {
  if (!url) {
    return "";
  }

  try {
    console.log("Downloading NSE attachment:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
          "AppleWebKit/537.36 (KHTML, like Gecko) " +
          "Chrome/139.0.0.0 Safari/537.36",

        Referer: "https://www.nseindia.com/",

        Accept:
          "application/pdf,application/octet-stream,*/*",
      },
    });

    if (!response.ok) {
      console.warn(
        `NSE attachment request failed: ${response.status}`
      );

      return "";
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(
      "Attachment downloaded:",
      buffer.length,
      "bytes"
    );

    if (!isPdfBuffer(buffer)) {
      console.warn(
        "NSE attachment is not a PDF. Skipping text extraction."
      );

      return "";
    }

    console.log("PDF detected. Extracting text...");

    const parser = new PDFParse({
      data: buffer,
    });

    try {
      const result = await parser.getText();

      const text = cleanText(
        result?.text || ""
      );

      console.log(
        `Extracted ${text.length} characters from NSE PDF`
      );

      return text;
    } finally {
      await parser.destroy();
    }
  } catch (error) {
    console.error(
      "NSE attachment extraction error:",
      error.message
    );

    return "";
  }
}

async function getCompanyNews(symbol) {
  try {
    const upperSymbol =
      String(symbol || "").toUpperCase();

    const url =
      `${NSE_BASE_URL}/api/corporate-announcements?` +
      `index=equities&symbol=${encodeURIComponent(
        upperSymbol
      )}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0",

        "Referer":
          "https://www.nseindia.com/",

        "Accept":
          "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `NSE announcements request failed: ${response.status}`
      );
    }

    const data = await response.json();

    const meaningfulKeywords = [
      "contract",
      "order",
      "deal",
      "partnership",
      "acquisition",
      "merger",
      "business",
      "transformation",
      "artificial intelligence",
      "ai ",
      "launch",
      "product",
      "results",
      "financial results",
      "earnings",
      "dividend",
      "buyback",
      "bonus",
      "appointment",
      "resignation",
      "approval",
      "regulatory",
      "agreement",
      "collaboration",
      "investment",
      "expansion",
      "record date",
      "split",
      "stock split",
      "rights issue",
      "fund raising",
      "fundraising",
      "capital",
      "takeover",
      "open offer",
      "scheme of arrangement",
      "shareholders meeting",
      "shareholder meeting",
      "annual general meeting",
      "agm",
      "postal ballot",
      "voting results",
      "scrutinizer",
      "regulation 31",
    ];

    const today = new Date();

    const cutoffDate = new Date();

    cutoffDate.setDate(
      today.getDate() - 90
    );

    /*
     * =========================================================
     * NSE API FIELD MAPPING
     * =========================================================
     *
     * NSE's corporate-announcements API gives us:
     *
     * desc
     *     -> announcement type/title
     *
     * attchmntText
     *     -> actual announcement description/topic
     *
     * attchmntFile
     *     -> PDF attachment URL
     *
     * IMPORTANT:
     *
     * `attchmntText` is NOT the extracted PDF text.
     *
     * It is the actual NSE announcement description.
     *
     * We therefore preserve it as the PRIMARY description.
     *
     * The PDF we download later becomes `attachmentText`.
     *
     * These two must remain separate.
     */

    const filtered = (data || [])
      .map((item) => {
        const announcementTitle =
          item.desc ||
          "";

        const announcementDescription =
          item.attchmntText ||
          item.description ||
          "";

        return {
          symbol:
            item.symbol ||
            upperSymbol,

          companyName:
            item.sm_name ||
            "",

          /*
           * NSE announcement type/title.
           *
           * Examples:
           * - Press Release
           * - Shareholder Meeting
           * - Consolidated And Standalone Unaudited
           *   Financial Results...
           */
          title:
            cleanText(
              announcementTitle
            ),

          /*
           * ACTUAL PRIMARY NSE DESCRIPTION.
           *
           * This is what News Agent should use to decide
           * what the filing is about.
           */
          description:
            cleanText(
              announcementDescription
            ),

          publishedAt:
            item.an_dt ||
            "",

          attachment:
            item.attchmntFile ||
            "",

          isin:
            item.sm_isin ||
            "",
        };
      })

      /*
       * ---------------------------------------------------------
       * DATE FILTER
       * ---------------------------------------------------------
       */

      .filter((item) => {
        const announcementDate =
          new Date(
            item.publishedAt
          );

        if (
          isNaN(
            announcementDate.getTime()
          )
        ) {
          return false;
        }

        return (
          announcementDate >=
          cutoffDate
        );
      })

      /*
       * ---------------------------------------------------------
       * MEANINGFUL ANNOUNCEMENTS FILTER
       * ---------------------------------------------------------
       *
       * IMPORTANT:
       *
       * Search both the announcement title AND the actual
       * NSE announcement description.
       *
       * Do NOT search the PDF here.
       */

      .filter((item) => {
        const text =
          `${item.title} ${item.description}`
            .toLowerCase();

        return meaningfulKeywords.some(
          (keyword) =>
            text.includes(keyword)
        );
      })

      /*
       * ---------------------------------------------------------
       * MOST RECENT FIRST
       * ---------------------------------------------------------
       */

      .sort(
        (a, b) =>
          new Date(
            b.publishedAt
          ) -
          new Date(
            a.publishedAt
          )
      )

      /*
       * Keep enough events for News Agent to rank.
       */
      .slice(0, 30);

    /*
     * =========================================================
     * PDF ENRICHMENT
     * =========================================================
     *
     * The PDF is supporting evidence.
     *
     * It is NOT the original announcement.
     */

    const enrichedNews =
      await Promise.all(
        filtered.map(
          async (event) => {
            let attachmentText =
              "";

            if (event.attachment) {
              attachmentText =
                await extractAttachmentText(
                  event.attachment
                );
            }

            /*
             * ---------------------------------------------------
             * CRITICAL SEPARATION
             * ---------------------------------------------------
             *
             * originalDescription
             *     = actual NSE API announcement text
             *
             * description
             *     = NSE announcement text + PDF details
             *
             * attachmentText
             *     = extracted PDF
             *
             * News Agent uses originalDescription/description
             * to classify the event and attachmentText for
             * supporting fact extraction.
             */

            const originalDescription =
              cleanText(
                event.description ||
                  ""
              );

            const combinedDescription =
              attachmentText
                ? `${originalDescription}\n\n` +
                  `NSE filing details:\n` +
                  `${attachmentText}`
                : originalDescription;

            return {
              ...event,

              /*
               * PRIMARY NSE ANNOUNCEMENT
               *
               * NEVER replace this with PDF text.
               */
              originalDescription,

              /*
               * SUPPORTING PDF TEXT
               */
              attachmentText,

              /*
               * Backward-compatible description.
               *
               * newsAgent.js already knows how to strip
               * "NSE filing details:" when it needs the
               * primary classification text.
               */
              description:
                combinedDescription,
            };
          }
        )
      );

    console.log(
      `NSE news loaded: ${enrichedNews.length} events`
    );

    const extractedCount =
      enrichedNews.filter(
        (event) =>
          event.attachmentText &&
          event.attachmentText.length > 0
      ).length;

    console.log(
      `NSE PDFs successfully extracted: ${extractedCount}`
    );

    return enrichedNews;
  } catch (error) {
    console.error(
      "Company announcements error:",
      error.message
    );

    return [];
  }
}

module.exports = {
  getCompanyNews,
};