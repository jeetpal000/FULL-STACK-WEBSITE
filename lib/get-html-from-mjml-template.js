import fs from "fs/promises";
import mjml2html from "mjml";
import path from "path"
import ejs from "ejs"
export const getHtmlFromMjmlTemplate = async (template, data)=>{
    const mjmlTemplate = await fs.readFile(path.join(import.meta.dirname, "..", "emails", `${template}.mjml`), "utf-8")    
    const filledTemplates = ejs.render(mjmlTemplate, data);
    // console.log(filledTemplates)
    return mjml2html(filledTemplates).html;
}