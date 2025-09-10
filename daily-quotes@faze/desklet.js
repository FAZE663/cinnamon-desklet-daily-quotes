const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const Mainloop = imports.mainloop;
const Soup = imports.gi.Soup;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

function DailyQuotes(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

DailyQuotes.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata, desklet_id);

        this.label = new St.Label({
            text: "Fetching quote...",
            style_class: "quote-label"
        });
        this.setContent(this.label);

        this._session = new Soup.Session();
        Soup.Session.prototype.add_feature.call(this._session, new Soup.ProxyResolverDefault());

        this._refresh();
    },

    _refresh: function() {
        let url = "https://api.quotable.io/random";
        let message = Soup.Message.new('GET', url);

        this._session.queue_message(message, (session, message) => {
            if (message.status_code === 200) {
                let data = JSON.parse(message.response_body.data);
                this.label.set_text(`"${data.content}" — ${data.author}`);
            } else {
                this._loadLocalQuote();
            }
        });

        // Refresh every 24 hours
        Mainloop.timeout_add_seconds(86400, () => this._refresh());
    },

    _loadLocalQuote: function() {
        try {
            let file = Gio.file_new_for_path(GLib.get_home_dir() + "/.local/share/cinnamon/desklets/daily-quotes@yourname/quotes.json");
            let [ok, contents] = file.load_contents(null);
            if (ok) {
                let quotes = JSON.parse(contents.toString());
                let randomIndex = Math.floor(Math.random() * quotes.length);
                let q = quotes[randomIndex];
                this.label.set_text(`"${q.text}" — ${q.author}`);
            } else {
                this.label.set_text("No quotes available.");
            }
        } catch (e) {
            this.label.set_text("Error loading local quotes.");
        }
    }
};

function main(metadata, desklet_id) {
    return new DailyQuotes(metadata, desklet_id);
}

