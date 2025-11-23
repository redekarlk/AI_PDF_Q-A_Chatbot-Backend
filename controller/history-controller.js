// controllers/history-controller.js
import History from "../model/history-model.js";
import Document from "../model/pdf-model.js"; // used for populate if needed

/**
 * GET /pdf/history
 * Query params:
 *   - page (default 1)
 *   - limit (default 20)
 *   - docId (optional) -> filter by specific document
 */
export const getHistory = async (req, res) => {
  try {
    const userId = req.userId; // set by auth middleware
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 100);
    const docId = req.query.docId || null;

    const filter = { userId };
    if (docId) filter.docId = docId;

    const skip = (page - 1) * limit;

    // Total count for pagination
    const total = await History.countDocuments(filter);

    // Query with populate to include document title
    const items = await History.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "docId",
        select: "title", // only need title
        model: Document
      })
      .lean();

    // normalize response: if docId was populated, put docTitle
    const history = items.map(h => ({
      id: h._id,
      question: h.question,
      answer: h.answer,
      docId: h.docId?._id ?? null,
      docTitle: h.docId?.title ?? null,
      createdAt: h.createdAt
    }));

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: history
    });
  } catch (err) {
    console.error("getHistory error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};
