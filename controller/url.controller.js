import { UrlShortener } from "../models/schema.js";
import { urlValidationSchema } from "../validators/url-validation.js";

//* shortener page
export const shortenerPage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const fetchLinks = await UrlShortener.find({ userId });
    const origin = req.protocol + "://" + req.get("host"); //http or https + :// + localhost:3008 or host name
    res.render("index", {
      links: fetchLinks,
      origin,
      errors: req.flash("errors"),
    });
  } catch (error) {
    res.status(500).send("server error");
  }
};

//* Shorten URL
export const shortenURL = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: No user ID found" });
  }
  const { data, error } = urlValidationSchema.safeParse(req.body);
  if (error) {
    // console.log(error.issues[0].message);
    req.flash("errors", error.issues[0].message);
    return res.redirect("/");
  }

  const { longurl, shortcode } = data;

  const existShortcode = await UrlShortener.findOne({ shortcode, userId });
  if (existShortcode) {
    // res.status(404).json({ message: "shortcode already exist" });
    req.flash("errors", "Shortcode is already exist")
  }

  try {
    const create = await UrlShortener.create({
      shortcode,
      longurl,
      userId,
    });
    // res.status(201).json({ message: "Short URL created", create });
    res.redirect("/")
  } catch (err) {
    console.error("Error writing to file:", err);
    // res.status(500).json({ error: "Internal server error" });
    req.flash("errors", "Internal server error")
  }
};

// export const getURL = async (req, res) => {
//     const allLinks = await UrlShortener.find({});
//     res.status(200).json({allLinks})
//     console.log(allLinks);
// }

//*   Delete URL from Database
export const deleteURL = async (req, res) => {
  const { id } = req.params;
  try {
    const findLink = await UrlShortener.findOneAndDelete({ _id: id });
    if (!findLink) return res.status(400).send("not found url");
    res.redirect("/");
  } catch (error) {
    
  }
};   

//* redirect link URL
export const redirectLink = async (req, res) => {
  const { shortcode } = req.params;
  try {
    const matchShortcode = await UrlShortener.findOne({ shortcode });
    if (!matchShortcode) {
      res.status(400).json({ msg: "ShortCode is not found" });
    }
    res.redirect(matchShortcode.longurl);
  } catch (error) {
    res.status(500).json({ msg: "Internal server error" });
  }
};

//* Edit URL and open new page
export const editURL = async (req, res) => {
  if (!req.user) return res.redirect("/login");
  const { id } = req.params;
  console.log("params", id);
  try {
    // res.status(200).json({id})
    const shortLink = await UrlShortener.findOne({ _id: id });
    console.log("shortlink id", shortLink);
    if (!shortLink) return res.send("not found id");
    res.render("auth/edit-shortLink.ejs", {
      shortLink,
      errors: req.flash("errors"),
    });
  } catch (error) {
    res.status(500).send("Interval server error");
  }
};

//* Update URL
export const updateURL = async (req, res) => {
  if (!req.user) return res.redirect("/login");

  const { id } = req.params;

  try {
    const { data, error } = urlValidationSchema.safeParse(req.body);
    if (error) {
      req.flash("errors", error.issues[0].message);
      return res.redirect(`/edit/${id}`);
    }

    const existShortcode = await UrlShortener.findOne({
      shortcode: data.shortcode,
      userId: req.user.id,
      _id: { $ne: id },
    });
    if (existShortcode) {
      req.flash("errors", "Shortcode already exists");
      return res.redirect(`/edit/${id}`);
    }
    const updatedLink = await UrlShortener.findByIdAndUpdate(
      id,
      { longurl: data.longurl, shortcode: data.shortcode },
      { new: true, runValidators: true }
    );
    if (!updatedLink) {
      req.flash("errors", "ShortLink not found");
      return res.redirect("/");
    }
    req.flash("success", "ShortLink updated successfully");
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};
