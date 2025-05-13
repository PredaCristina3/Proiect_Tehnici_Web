const express = require("express");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const sass = require("sass")

app = express();

console.log("Folderul proiectului: ", __dirname)
console.log("Calea fisierului index.js: ", __filename)
console.log("Folderul curent de lucru: ", process.cwd()) //current work director, nu vor fi intotdeauna aceleasi

app.set("view engine", "ejs")

obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup")
}


vect_foldere = ["temp", "backup"]
for (let folder of vect_foldere ){
    let caleFolder = path.join(__dirname, folder)
    if(!fs.existsSync(caleFolder))
        fs.mkdirSync(caleFolder);
}


function compileazaScss(caleScss, caleCss){
    console.log("cale:", caleCss);
    if(!caleCss){
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
        caleCss = numeFis+".css";
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss )
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss )
    
    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, {recursive:true})
    }
    
    // la acest punct avem cai absolute in caleScss si  caleCss

    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)){
        // Adaugare timestamp in numele fisierului 
        let timestamp = new Date().getTime();
        let ext = path.extname(caleCss); // "extensia .css"
        let numeFisierFaraExt = path.basename(caleCss, ext); // "numele fisierului fara extensie"

        // Backup cu timestamp a_timestamp.css"
        let caleBackupCuTimestamp = path.join(caleBackup, `${numeFisierFaraExt}_${timestamp}${ext}`);
        fs.copyFileSync(caleCss, caleBackupCuTimestamp);    
    }
    rez = sass.compile(caleScss, {"sourceMap":true});
    fs.writeFileSync(caleCss, rez.css)
    //console.log("Compilare SCSS",rez);
}
    //compileazaScss("a.scss");

//la pornirea serverului
vFisiere = fs.readdirSync(obGlobal.folderScss);
for( let numeFis of vFisiere ) {
    if (path.extname(numeFis) == ".scss"){
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function(eveniment, numeFis) {
    console.log(eveniment, numeFis);
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)){
            compileazaScss(caleCompleta);
        }
    }
})


function initErori(){
    let continut = fs.readFileSync(path.join(__dirname,"resurse/json/erori.json")).toString("utf-8");
    obGlobal.obErori = JSON.parse(continut)
    obGlobal.obErori.eroare_default.imagine = path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine)
    for (let eroare of obGlobal.obErori.info_erori){
        eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine)
    }
    console.log(obGlobal.obErori)
}

initErori()

function initImagini(){
    var continut = fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");
    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;
    let caleAbs = path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu = path.join(__dirname, obGlobal.obImagini.cale_galerie, "mediu");
    let caleAbsMic = path.join(__dirname, obGlobal.obImagini.cale_galerie, "mic");

    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);
    if (!fs.existsSync(caleAbsMic))
        fs.mkdirSync(caleAbsMic);

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini){
        [numeFis, ext] = imag.fisier.split(".");
        
        let caleFisAbs1 = path.join(caleAbs, imag.fisier);
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs1).resize(300).toFile(caleFisMediuAbs);
        imag.fisier_mediu = path.join("/", obGlobal.obImagini.cale_galerie, "mediu", numeFis+".webp" )
        
        let caleFisAbs2 = path.join(caleAbs, imag.fisier);
        let caleFisMicAbs = path.join(caleAbsMic, numeFis+".webp");
        sharp(caleFisAbs2).resize(150).toFile(caleFisMicAbs);
        imag.fisier_mic = path.join("/", obGlobal.obImagini.cale_galerie, "mic", numeFis+".webp" )
        
        imag.fisier = path.join("/", obGlobal.obImagini.cale_galerie, imag.fisier )
    }
    console.log(obGlobal.obImagini)
}

initImagini();


function genereazaScssGalerie(numarImagini) {
    const durataSlide = 5;
    const scss = `
$durataSlide: ${durataSlide}s;
$numarImagini: ${numarImagini};
$durataTotala: $durataSlide * $numarImagini;

@keyframes slideShow {
    0% { opacity: 0; clip-path: inset(50% 0 50% 0); z-index: 1 }
    10% { opacity: 1; clip-path: inset(0 0 0 0); z-index: 1 }
    25% { opacity: 1; z-index: 2 }
    35% { opacity: 0; clip-path: inset(50% 0 50% 0); z-index: 2 }
    100% { opacity: 0; z-index: 1}
}

#galerie-frame {
    position: relative;
    width: 400px;
    height: 400px;
    overflow: hidden;
    margin: auto;
    border: 20px solid transparent;
    border-image: url("/resurse/img/border.png") 30 round;

    &:hover .slide {
        animation-play-state: paused;
    }

.slide {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    clip-path: inset(50% 0 50% 0);
    animation: slideShow $durataTotala linear infinite;

    @for $i from 1 through $numarImagini {
        &:nth-child(#{$i}) {
            animation-delay: $durataSlide * ($i - 1);
        }
    }

    picture, img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    figcaption {
        position: absolute;
        bottom: 5px;
        width: 100%;
        text-align: center;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        font-size: 14px;
        border-radius: 5px;
        z-index: 2;
        }
    }
}

@media screen and (max-width: 1000px) {
    #galerie-frame {
        display: none;
    }
}
`;

    fs.writeFileSync(path.join(__dirname, 'resurse/scss/galerie-dinamica.scss'), scss);
}

// Alegem o putere a lui 2: 2, 4, 8, 16
    const puteri = [2, 4, 8, 16];
    const randomCount = puteri[Math.floor(Math.random() * puteri.length)];
    // Filtrăm imaginile cu indici pari
    const imagPare = obGlobal.obImagini.imagini.filter(function(img, index) {
        return index % 2 === 0;
    });
    // Selectăm primele 'randomCount' imagini
    const imagSelect = imagPare.slice(0, randomCount); 
        genereazaScssGalerie(imagSelect.length); 

function afisareEroare(res, identificator, titlu, text, imagine){
    let eroare = obGlobal.obErori.info_erori.find(function(elem){ 
        return elem.identificator == identificator
    });
    if(eroare){
        if(eroare.status)
            res.status(identificator)
        var titluCustom = titlu || eroare.titlu;
        var textCustom = text || eroare.text;
        var imagineCustom = imagine || eroare.imagine;
    }
    else{
        var err = obGlobal.obErori.eroare_default
        var titluCustom = titlu || err.titlu;
        var textCustom = text || err.text;
        var imagineCustom = imagine || err.imagine;
    }
    res.render("pagini/eroare", { //transmit obiectul locals
        titlu: titluCustom,
        text: textCustom,
        imagine: imagineCustom
    })
}


app.use("/resurse", express.static(path.join(__dirname, "resurse")))
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")))

app.get("/favicon.ico", function(req, res, next){
    res.sendFile(path.join(__dirname + "/resurse/ico/favicon/favicon.ico"));
})

app.get(["/", "/index", "/home"], function(req, res){
    res.render("pagini/index", {ip: req.ip, imagini: obGlobal.obImagini.imagini})
})

app.get("/galerie", function(req, res){
    res.render("pagini/galerie", {imagini: obGlobal.obImagini.imagini})
})

app.get(/^\/resurse\/[a-zA-Z0-9_\/]*$/, function(req, res, next){
    afisareEroare(res, 403);
})

app.get("/*.ejs", function(req, res, next){
    afisareEroare(res, 400);
})

app.get("/*", function(req, res, next){
    try{
        res.render("pagini"+req.url, function(err, rezultatRandare){
            if (err){
                if(err.message.startsWith("Failed to lookup view")){
                    afisareEroare(res,404);
                }
                else{
                    afisareEroare(res);
                }
            }
            else{
                console.log(rezultatRandare);
                res.send(rezultatRandare)
            }
        });
    }
    catch(errRandare){
        if(errRandare.message.startsWith("Cannot find module")){
            afisareEroare(res,404);
        }
        else{
            afisareEroare(res);
        }
    }
})

app.listen(8080);
console.log("Serverul a pornit")
