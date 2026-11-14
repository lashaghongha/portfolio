using System.Net;
using System.Net.Mail;

namespace PortfolioApi.Services;

// Sends contact-form messages over SMTP. All settings come from environment
// variables so no secrets live in source. When SMTP is not configured the sender
// is disabled and the endpoint falls back to logging only — the form keeps working.
//
// Required env vars to enable email (e.g. Brevo SMTP relay):
//   SMTP_HOST   e.g. smtp-relay.brevo.com
//   SMTP_PORT   e.g. 587            (optional, default 587)
//   SMTP_USER   SMTP login / username
//   SMTP_PASS   SMTP key / password
//   SMTP_FROM   verified sender address (optional, defaults to SMTP_USER)
//   CONTACT_TO  where messages are delivered (optional, defaults to SMTP_FROM)
public sealed class EmailSender
{
    private readonly string? _host;
    private readonly int _port;
    private readonly string? _user;
    private readonly string? _pass;
    private readonly string _from;
    private readonly string _to;
    private readonly ILogger<EmailSender> _logger;

    public EmailSender(ILogger<EmailSender> logger)
    {
        _logger = logger;
        _host = Env("SMTP_HOST");
        _port = int.TryParse(Env("SMTP_PORT"), out var p) ? p : 587;
        _user = Env("SMTP_USER");
        _pass = Env("SMTP_PASS");
        _from = Env("SMTP_FROM") ?? _user ?? string.Empty;
        _to = Env("CONTACT_TO") ?? _from;
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_host) &&
        !string.IsNullOrWhiteSpace(_from) &&
        !string.IsNullOrWhiteSpace(_to);

    public string FromAddress => _from;

    // Sends the contact message. Returns true when actually delivered, false when
    // email is not configured (caller treats that as a soft success + log).
    public async Task<bool> SendContactAsync(string name, string fromEmail, string message, CancellationToken ct = default)
    {
        if (!IsConfigured)
        {
            _logger.LogInformation("Email disabled (SMTP not configured). Contact from {Name} <{Email}>", name, fromEmail);
            return false;
        }

        using var mail = new MailMessage
        {
            From = new MailAddress(_from, $"{name} (portfolio)"),
            Subject = $"Portfolio contact from {name}",
            Body = $"Name: {name}\nEmail: {fromEmail}\n\n{message}",
            IsBodyHtml = false,
        };
        mail.To.Add(_to);
        // So you can reply straight to the visitor from your inbox.
        mail.ReplyToList.Add(new MailAddress(fromEmail, name));

        using var client = new SmtpClient(_host!, _port)
        {
            EnableSsl = true,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            Timeout = 15000,
        };
        if (!string.IsNullOrWhiteSpace(_user))
            client.Credentials = new NetworkCredential(_user, _pass);

        // Cap the send so a stuck SMTP connection can't hang forever.
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(15));
        await client.SendMailAsync(mail, cts.Token);
        _logger.LogInformation("Contact email delivered to {To} for {Name} <{Email}>", _to, name, fromEmail);
        return true;
    }

    private static string? Env(string key)
    {
        var value = Environment.GetEnvironmentVariable(key);
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
