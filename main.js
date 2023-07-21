let epicgame;
let login;
let did;
let dates = { items: [] };
var m3u8Array = Array();


_initPlayer();




async function _initPlayer() {
    let date = new Date();
    let hehehe = await updateDates(date);
    console.log(hehehe);

    let games = Array();

    for (let i = 0; i < dates.items.length; i++) {
        for (let e = 0; e < dates.items[i].length; e++) {
            let date = new Date();
            let gameDate = new Date(dates.items[i][e].time);

            let currentTime = date.getTime();
            let gameTime = gameDate.getTime();
            let dif = currentTime - gameTime;

            if (dif > -3e5 && dif < 8.1e6) {
                games.push(dates.items[i][e]);
            }
        }
    }


    games.length ? _initLive(games) : _initDead();
}




async function _initLive(games) {
    let el = document.createElement('div');
    el.id = 'links';
    document.body.appendChild(el);

    for (let i = 0; i < games.length; i++) {
        let link = document.createElement('div');
        link.innerText = `${games[i].t1} vs. ${games[i].t2} >>`;
        link.onclick = () => { startVideo(games[i]) }
        link.classList.add('link');
        el.appendChild(link);
    }
}





function _initDead() {
    console.log("Dead!");
    let html = `
    <div style="color: white; font-family: sans-serif; font-size: 36px">
      Broadcasts are over...
    </div>
    <div
      style="
        color: gray;
        font-family: sans-serif;
        font-size: 20px;
        padding: 40px;
        font-style: italic;
      "
    >
      Come back later for more World Cup games :)

      <br />
      <br />
      (or if a game is playing right now and you don't see it, tell alexcks)
    </div>
    <div
      id="date"
      style="
        color: white;
        font-family: sans-serif;
        font-weight: bold;
        font-size: 28px;
        position: absolute;
        transform: translate(-50%, -50%);
        left: 50%;
        border: aqua 1px solid;
        border-radius: 5px;
        width: 500px;
      "
    ></div>`;

    let el = document.createElement('div');
    el.classList.add('yup');
    el.innerHTML = html;
    document.body.appendChild(el);


    let dateEl = document.querySelector("#date");
    countdown()
    async function countdown() {
        let nextGame = filterDates(dates);
        setInterval(() => {
            let current = Date.now();
            let dif = nextGame - current;

            let seconds = Math.floor(dif / 1000) % 60;
            let minutes = Math.floor(dif / 60000) % 60;
            let hours = Math.floor(dif / 3600000);
            dateEl.innerText = `${hours}:${(minutes.toString().length === 1 ? "0" : "") + minutes}:${(seconds.toString().length === 1 ? "0" : "") + seconds}`;
        })

    }

    function filterDates(data) {
        let currentTime = Date.now();
        let last = 1e10, game;
        for (let i = 0; i < data.items.length; i++) {
            data.items[i].forEach((e) => {
                let gameTime = new Date(e.time).getTime();
                let dif = gameTime - currentTime;
                if (dif < last && dif > -1e6) (last = dif), (game = gameTime);
            });
        }
        return game;
    }
}





function getQuality(m3, currentGame) {
    m3 = m3.split("\n");
    console.log(m3);
    m3u8Array = m3;

    var qualityContainer = document.createElement("div");
    qualityContainer.id = "qualities";
    qualityContainer.innerHTML = `<label class="m">Remember, a higher bandwith = better quality (expect it to be slower, too)</label>`;

    for (let i = 0; i < m3.length; i++) {
        if (m3[i].includes(`.m3u8`)) {
            let stats = m3[i - 1]; //#EXT-X-STREAM-INF:BANDWIDTH=7476480,AVERAGE-BANDWIDTH=6705600,CODECS="avc1.640020,mp4a.40.2",RESOLUTION=1280x720,FRAME-RATE=59.940
            let bandwith = stats.split("BANDWIDTH=")[1].split(",")[0];
            let res = stats.split("RESOLUTION=")[1].split(",")[0].split("x")[1];
            let frameRate = stats.split("RATE=")[1];

            let qualitySelect = document.createElement("button");
            qualitySelect.innerText = `Resolution: ${res}p, FPS: ${frameRate}, Bandwith: ${bandwith}`;
            qualitySelect.className = "qualityButton";
            qualitySelect.setAttribute("quality", i);
            qualitySelect.addEventListener("click", chooseQuality);
            qualityContainer.appendChild(qualitySelect);
        }
    }
    document.body.appendChild(qualityContainer);
    document.querySelector("html").style.cursor = "auto";

    //let quality = "5";
    /*for (let i = 0; i < m3.length; i++) {
        if (m3[i].includes(`${quality}.m3u8`) || m3[i].includes(`h.m3u8`))m3u8 = m3[i];
    }*/
    //console.log(m3u8);
    //Sets the quality of the video
    //playVideo(m3u8);
}

function chooseQuality() {
    let m3u8 = m3u8Array[this.getAttribute("quality")];
    console.log(m3u8);
    document.querySelector("#qualities").style.display = 'none';
    playVideo(m3u8);
}





async function initLogin() {
    did = new DeviceUUID().get();
    let test = did;
    for (let i = 0; i < did.length; i++) {
        let code = did.charCodeAt(i);
        if (code >= 97 && code <= 122) {
            test = test.split("");
            test[i] = String.fromCharCode(Math.floor(Math.random() * 26) + 97)
            test = test.join("");
        }
    }
    did = test;

    let response = await fetch("https://api3.fox.com/v2.0/login", {
        headers: {
            "content-type": "application/json",
            "x-api-key": "cf289e299efdfa39fb6316f259d1de93"
        },
        body: JSON.stringify({ deviceId: did }),
        method: "POST",
    });

    login = await response.json();

    let hehe = await fetch(`https://api3.fox.com/v2.0//previewpassmvpd?device_id=${did}&mvpd_id=TempPass_fbcfox_60min`, {
        headers: {
            "x-api-key": "cf289e299efdfa39fb6316f259d1de93"
        }
    });
    let data = await hehe.json();
    login.accessToken = data.accessToken;
    console.log(data);
    return data;
}





async function fetchm3files(currentGame) {

    if (!login) throw new Error('Couldn\'t fetch -- try logging in first.');
    epicgame = currentGame;
    console.log(currentGame);

    let response = await fetch(`https://api3.fox.com/v2.0/screens/foxsports-detail/soccer/wwc/events/${currentGame.url.split('boxscore-')[1]}`, {
        headers: {
            "x-api-key": "cf289e299efdfa39fb6316f259d1de93",
        },
        method: "GET",
    });

    let data = await response.json()

    if (!data.panels?.member[0]?.items?.member[0]?.id) { console.log('retrying'); return fetchm3files(d, index); }

    let streamid = data.panels.member[0].items.member[0].id;
    let payload = {
        capabilities: ["drm/widevine", "fsdk/yo/v3"],
        deviceWidth: 1536,
        deviceHeight: 800,
        maxRes: "1080p",
        os: "windows",
        osv: "",
        provider: {
            freewheel: { did: login.deviceId },
            vdms: { rays: "" },
        },
        playlist: "",
        privacy: { us: "1---", lat: false },
        siteSection: null,
        streamType: "live",
        streamId: "",
        debug: { traceId: null },
    };
    payload.streamId = streamid;

    let hehe = await fetch("https://api3.fox.com/v2.0/watch", {
        headers: {
            "content-type": "application/json",
            authorization: `Bearer ${login.accessToken}`,
            "x-api-key": "cf289e299efdfa39fb6316f259d1de93",
        },
        body: JSON.stringify(payload),
        method: "POST",
    });

    data = await hehe.json();

    let linkp = await fetch(data.url);
    let playerData = await linkp.json();

    if (playerData.prefix.includes('edge')) {
        console.log('me no likey');
        return fetchm3files(d, index);
    }

    let m31 = await fetch(playerData.playURL);
    let text = await m31.text();

    console.log(text);

    getQuality(text, currentGame);
}


async function updateDates(date) {
    return new Promise(async (resolve) => {
        for (let i = 0; i < 4; i++) {
            let month = date.getMonth();
            let d = date.getDate() + i;

            let response = await fetch(`https://api.foxsports.com/bifrost/v1/soccer/league/scores-segment/c14d20230${month + 1}${d < 10 ? "0" + d : d}?groupId=14&apikey=jE7yBJVRNAwdDesMgTzTXUUSx1It41Fq`);
            if (response.status !== 200) return;
            let data = await response.json();
            if (!data.sectionList.length) return resolve(dates);
            dates.items.push(filterItem(data.sectionList[0]));
        }

        resolve(dates);
    });
}

function filterItem(d) {
    let o = Array();
    for (let i = 0; i < d.events.length; i++) {
        let item = d.events[i];
        let g = {}
        g.url = item.entityLink.webUrl;
        g.time = item.eventTime;
        g.t1 = item.upperTeam.longName;
        g.t2 = item.lowerTeam.longName;
        o[i] = g;
    }
    return o;
}


async function startVideo(game) {
    document.querySelector("#links").style.display = 'none';
    document.querySelector("html").style.cursor = "progress";
    await initLogin();
    await fetchm3files(game);
}

async function playVideo(src) {
    let v = document.createElement('div');
    v.innerHTML = `<video controls autoplay></video>`;
    document.body.appendChild(v);

    var video = v.children[0];
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) return video.src = src;
    var hls = new Hls();
    hls.attachMedia(video);
    hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        console.log("video and hls.js are now bound together !");
        hls.loadSource(src);
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            console.log("manifest loaded, found " + data.levels.length + " quality level");
            video.play();
        });
    });
}


