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
    }
    createURLSearchParams(data) {
        const params = new URLSearchParams();
        Object.keys(data).forEach(key => params.append(key, data[key]));
        return params;
    }
    getCurrentDefFile() {
        return fetch("https://proxy.poyashi.me/?type=bpi");
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
            console.log(this.ranks);
            const diffObj = {
                "3": "hyper",
                "4": "another",
                "10": "leggendaria"
            };
            const notFound = [];
            for (let i = 0; i < this.def.length; ++i) {
                const current = this.def[i];
                const songTitle = current["title"] + diffObj[current["difficulty"]];
                const target = this.ranks[songTitle];
                if (!target) {
                    notFound.push(songTitle);
                    continue;
                }
                if (target === Number(this.def[i]["wr"])) {
                    console.log(`${songTitle}:SAME WR. SKIPPED(EQUAL), OLD:${this.def[i]["wr"]},NEW:${target}`);
                    continue;
                }
                if (target < Number(this.def[i]["wr"])) {
                    console.log(`${songTitle}:SAME WR. SKIPPED(LOW), OLD:${this.def[i]["wr"]},NEW:${target}`);
                    continue;
                }
                console.log(`${songTitle}:OLD=${this.def[i]["wr"]},NEW=${target}`);
                this.def[i]["wr"] = target;
            }
            console.log(this.def, JSON.stringify(this.def));
            console.log(notFound);
        });
    }
}
var t = new WRGetter().run();
