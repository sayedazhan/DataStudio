export default function ProWaitlistForm() {
  return (
    <form
      name="pro-waitlist"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      action="/thanks/pro-waitlist"
      className="marketingWaitlistForm"
    >
      <input type="hidden" name="form-name" value="pro-waitlist" />
      <p className="marketingBotField" aria-hidden="true"><label>Leave this field empty <input name="bot-field" /></label></p>
      <div className="marketingFormGrid">
        <label>
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required placeholder="Your name" />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
        </label>
        <label>
          <span>Company <em>optional</em></span>
          <input name="company" type="text" autoComplete="organization" placeholder="Company name" />
        </label>
        <label>
          <span>What interests you most?</span>
          <select name="interest" defaultValue="saved-analyses">
            <option value="saved-analyses">Saved analyses & history</option>
            <option value="premium-reports">Premium reports</option>
            <option value="automation">Excel / workflow automation</option>
            <option value="ai-intelligence">AI-powered intelligence</option>
            <option value="higher-limits">Higher usage limits</option>
            <option value="business">Business / team use</option>
          </select>
        </label>
      </div>
      <label className="marketingConsentLine">
        <input type="checkbox" name="product-updates" value="yes" defaultChecked />
        <span>Keep me updated about Data Studio Pro and major product releases.</span>
      </label>
      <button className="marketingPrimaryButton" type="submit">Join the Pro Waitlist →</button>
      <small className="marketingFormNote">No account is created. Your details are used only to follow up about Data Studio and product updates.</small>
    </form>
  );
}
