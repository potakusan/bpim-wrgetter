"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class WRGetter {
    constructor() {
        this.def = [];
        this.ranks = {};
        this.decodeAsText = (arrayBuffer, encoding) => new TextDecoder(encoding).decode(arrayBuffer);
        this.diffObj = {
            "3": "hyper",
            "4": "another",
            "10": "leggendaria"
        };
        this.notFound = [];
        this.songTitle = (t) => t["title"] + this.diffObj[t["difficulty"]];
    }
    createURLSearchParams(data) {
        const params = new URLSearchParams();
        Object.keys(data).forEach(key => params.append(key, data[key]));
        return params;
    }
    getCurrentDefFile(q = "bpi") {
        return fetch("https://proxy.poyashi.me/?type=" + q);
    }
    getWR(version) {
        return fetch("https://p.eagate.573.jp/game/2dx/27/ranking/json/topranker.html", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: this.createURLSearchParams({
                pref_id: "0",
                play_style: "0",
                page: "0",
                limit: "5000",
                series_id: version
            })
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("b");
            this.def = (yield (yield this.getCurrentDefFile()).json()).body;
            const maxVer = 27;
            for (let i = 0; i < maxVer; ++i) {
                const response = yield this.getWR(String(i));
                const arrayBuffer = yield response.arrayBuffer();
                const res = JSON.parse(this.decodeAsText(arrayBuffer, 'shift-jis'));
                for (let j = 0; j < res.list.length; ++j) {
                    const song = res.list[j];
                    for (let k = 0; k < 3; ++k) {
                        if (k === 0 && song["score_2"] === 0) {
                            continue;
                        }
                        if (k === 1 && song["score_3"] === 0) {
                            continue;
                        }
                        if (k === 2 && song["score_4"] === 0) {
                            continue;
                        }
                        const diff = k === 0 ? "hyper" : k === 1 ? "another" : "leggendaria";
                        const p = String(song["music"]) + diff;
                        this.ranks[p] = Number(k === 0 ? song["score_2"] : k === 1 ? song["score_3"] : song["score_4"]);
                    }
                }
            }
            this.readReleaseFile();
            const p1 = yield this.readInputFiles("11");
            const p2 = yield this.readInputFiles("12");
            console.error("SONGS IN WHICH ERROR OCCURED", this.notFound);
            console.info("INPUT FILE #11 OUTPUT", JSON.stringify(p1));
            console.info("INPUT FILE #12 OUTPUT", JSON.stringify(p2));
            console.info("RELEASE FILE OUTPUT", JSON.stringify(this.def));
            this.checkConsistency(this.def, p1, p2);
        });
    }
    readReleaseFile() {
        for (let i = 0; i < this.def.length; ++i) {
            const current = this.def[i];
            const songTitle = this.songTitle(current);
            const target = this.ranks[songTitle];
            this.def[i]["wr"] = this.exec(target, songTitle, this.def[i]["wr"]);
        }
    }
    readInputFiles(diff) {
        return __awaiter(this, void 0, void 0, function* () {
            const t = (yield (yield this.getCurrentDefFile("bpiSP" + diff)).json());
            for (let i = 0; i < t.length; ++i) {
                const songTitle = this.songTitle(t[i]);
                const target = this.ranks[songTitle];
                t[i]["wr"] = this.exec(target, songTitle, t[i]["wr"]);
            }
            return t;
        });
    }
    exec(target, songTitle, old) {
        if (!target) {
            this.notFound.push(songTitle);
            return old;
        }
        if (target === Number(old)) {
            console.warn(`${songTitle}:SAME WR. SKIPPED(EQUAL), OLD:${old},NEW:${target}`);
            return old;
        }
        if (target < Number(old)) {
            console.warn(`${songTitle}:SAME WR. SKIPPED(LOW), OLD:${old},NEW:${target}`);
            return old;
        }
        console.log(`%c ${songTitle}:OLD=${old},NEW=${target}`, 'color: #ff0000');
        return target;
    }
    checkConsistency(def, p1, p2) {
        const defList = def.reduce((groups, item) => {
            groups[this.songTitle(item)] = item;
            return groups;
        }, {});
        p1.concat(p2).map((item) => {
            const songTitle = this.songTitle(item);
            if (defList[songTitle] && defList[songTitle]["wr"] !== item["wr"]) {
                console.warn("%c checkConsistencyError:", songTitle, "release:" + defList[songTitle]["wr"], "input:" + item["wr"], "color:#ff0000, background:#000");
            }
        });
    }
}
var t = new WRGetter().run();
