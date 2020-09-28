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

  private getCurrentDefFile(q:string = "bpi"){
    return fetch("https://proxy.poyashi.me/?type=" + q);
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

  private diffObj = {
    "3":"hyper",
    "4":"another",
    "10":"leggendaria"
  }
  private notFound:string[] = [];

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
    this.readReleaseFile();
    const p1 = await this.readInputFiles("11");
    const p2 = await this.readInputFiles("12");
    console.error("SONGS IN WHICH ERROR OCCURED",this.notFound);
    console.info("INPUT FILE #11 OUTPUT",JSON.stringify(p1));
    console.info("INPUT FILE #12 OUTPUT",JSON.stringify(p2));
    console.info("RELEASE FILE OUTPUT",JSON.stringify(this.def));
    this.checkConsistency(this.def,p1,p2)
  }

  songTitle = (t:any)=>t["title"] + this.diffObj[(t["difficulty"] as "3"|"4"|"10")];

  readReleaseFile(){
    for(let i = 0; i < this.def.length; ++i){
      const current = this.def[i];
      const songTitle = this.songTitle(current);
      const target = this.ranks[songTitle];
      this.def[i]["wr"] = this.exec(target,songTitle,this.def[i]["wr"]);
    }
  }

  async readInputFiles(diff:string){
    const t = (await  (await this.getCurrentDefFile("bpiSP" + diff)).json());
    for(let i = 0;i < t.length; ++i){
      const songTitle = this.songTitle(t[i]);
      const target = this.ranks[songTitle];
      t[i]["wr"] = this.exec(target,songTitle,t[i]["wr"]);
    }
    return t;
  }

  exec(target:number,songTitle:string,old:string){
    if(!target){
      this.notFound.push(songTitle);
      return old;
    }
    if(target === Number(old)){
      console.warn(`${songTitle}:SAME WR. SKIPPED(EQUAL), OLD:${old},NEW:${target}`);
      return old;
    }
    if(target < Number(old)){
      console.warn(`${songTitle}:SAME WR. SKIPPED(LOW), OLD:${old},NEW:${target}`);
      return old;
    }
    console.log(`%c ${songTitle}:OLD=${old},NEW=${target}`, 'color: #ff0000');
    return target;
  }

  checkConsistency(def:any[],p1:any[],p2:any[]){
    const defList = def.reduce((groups,item)=>{
      groups[this.songTitle(item)] = item;
      return groups;
    },{});
    p1.concat(p2).map((item)=>{
      const songTitle = this.songTitle(item);
      if(defList[songTitle] && defList[songTitle]["wr"] !== item["wr"]){
        console.warn("%c checkConsistencyError:",songTitle,"release:" + defList[songTitle]["wr"],"input:"+item["wr"],"color:#ff0000, background:#000");
      }
    });
  }

}

var t = new WRGetter().run();
