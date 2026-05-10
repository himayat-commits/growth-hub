import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const { name, email, business, interests, message, ref } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const businessLine = business ? business : "no business listed";
    const interestLine =
      interests && interests.length > 0
        ? interests.join(", ")
        : "Not specified";

    const subject = `New enquiry ${ref ?? ""} from ${name} — ${businessLine}`;

    const html = `
<div style="font-family: Georgia, serif; max-width: 600px; color: #0D3F48;">
  <div style="background:#0D3F48; color:#F3F0E7; padding: 28px 32px; border-radius: 8px 8px 0 0;">
    <h2 style="margin:0; font-weight:400; font-size:24px;">New Growth Hub Enquiry</h2>
    <p style="margin:6px 0 0; opacity:0.75; font-size:14px;">${ref ?? ""}</p>
  </div>
  <div style="background:#FCFAF3; border:1px solid #E6E1D2; border-top:none; padding: 28px 32px; border-radius: 0 0 8px 8px;">
    <table style="width:100%; border-collapse:collapse; font-size:16px;">
      <tr><td style="padding:10px 0; border-bottom:1px solid #E6E1D2; font-weight:600; width:140px; color:#4A6A70; font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Name</td><td style="padding:10px 0; border-bottom:1px solid #E6E1D2;">${name}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #E6E1D2; font-weight:600; color:#4A6A70; font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Email</td><td style="padding:10px 0; border-bottom:1px solid #E6E1D2;"><a href="mailto:${email}" style="color:#0D3F48;">${email}</a></td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #E6E1D2; font-weight:600; color:#4A6A70; font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Business</td><td style="padding:10px 0; border-bottom:1px solid #E6E1D2;">${businessLine}</td></tr>
      <tr><td style="padding:10px 0; border-bottom:1px solid #E6E1D2; font-weight:600; color:#4A6A70; font-size:12px; letter-spacing:0.1em; text-transform:uppercase;">Interested in</td><td style="padding:10px 0; border-bottom:1px solid #E6E1D2;">${interestLine}</td></tr>
    </table>
    ${
      message
        ? `<div style="margin-top:24px;">
        <p style="font-size:12px; font-weight:600; color:#4A6A70; letter-spacing:0.1em; text-transform:uppercase; margin:0 0 10px;">Message</p>
        <p style="margin:0; line-height:1.65; white-space:pre-wrap;">${message}</p>
      </div>`
        : ""
    }
    <div style="margin-top:32px; padding-top:20px; border-top:1px solid #E6E1D2; font-size:13px; color:#7A9098;">
      Reply directly to this email to respond to ${name}.
    </div>
  </div>
</div>`;

    await resend.emails.send({
      from: "Growth Hub <noreply@himayat.com.au>",
      to: ["hello@himayat.com.au"],
      replyTo: email,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please email us directly." },
      { status: 500 }
    );
  }
}
