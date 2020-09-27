class WRGetter {
  constructor(){

  }

 private createURLSearchParams(data:any) {
   const params = new URLSearchParams();
   Object.keys(data).forEach(key => params.append(key, data[key]));
   return params;
 }

  private def:any[] = [];
  private ranks:any = {};
  private decodeAsText = (arrayBuffer:ArrayBuffer, encoding:string) => new TextDecoder(encoding).decode(arrayBuffer);

  private getCurrentDefFile(){
    return fetch("https://proxy.poyashi.me/?type=bpi");
  }

  private getWR(version:string){
    return fetch("https://p.eagate.573.jp/game/2dx/27/ranking/json/topranker.html",{
      method:"POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body:this.createURLSearchParams(
        {
          pref_id:"0",
          play_style:"0",
          page:"0",
          limit:"5000",
          series_id:version
        }
      )
    })
  }

  public async run(){
    console.log("b");
    this.def = (await (await this.getCurrentDefFile()).json()).body;
    const maxVer = 27;
    for(let i =0; i < maxVer; ++i){
      const response = await this.getWR(String(i));
      const arrayBuffer = await response.arrayBuffer();
      const res = JSON.parse(this.decodeAsText(arrayBuffer, 'shift-jis'));
      for(let j =0; j < res.list.length; ++j){
        const song = res.list[j];
        for(let k =0; k < 3; ++k){
          if(k === 0 && song["score_2"] === 0){
            continue;
          }
          if(k === 1 && song["score_3"] === 0){
            continue;
          }
          if(k === 2 && song["score_4"] === 0){
            continue;
          }
          const diff:string = k === 0 ? "hyper" : k === 1 ? "another" : "leggendaria";
          const p:string = String(song["music"]) + diff;
          this.ranks[p] = Number(k === 0 ? song["score_2"] :  k === 1 ? song["score_3"] : song["score_4"]);
        }
      }
    }
    console.log(this.ranks);
    const diffObj = {
      "3":"hyper",
      "4":"another",
      "10":"leggendaria"
    }
    const notFound:string[] = [];
    for(let i = 0; i < this.def.length; ++i){
      const current = this.def[i];
      const songTitle = current["title"] + diffObj[(current["difficulty"] as "3"|"4"|"10")];
      const target = this.ranks[songTitle];
      if(!target){
        notFound.push(songTitle);
        continue;
      }
      if(target === Number(this.def[i]["wr"])){
        console.log(`${songTitle}:SAME WR. SKIPPED(EQUAL), OLD:${this.def[i]["wr"]},NEW:${target}`);
        continue;
      }
      if(target < Number(this.def[i]["wr"])){
        console.log(`${songTitle}:SAME WR. SKIPPED(LOW), OLD:${this.def[i]["wr"]},NEW:${target}`);
        continue;
      }
      console.log(`${songTitle}:OLD=${this.def[i]["wr"]},NEW=${target}`);
      this.def[i]["wr"] = target;
    }
    console.log(this.def,JSON.stringify(this.def));
    console.log(notFound);
  }
}

var t = new WRGetter().run();
