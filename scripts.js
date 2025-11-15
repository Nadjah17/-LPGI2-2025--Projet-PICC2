
const tabNumeros = ["757002020", "771234567", "781112233", "764445555", "708889999"];
const tabSoldes  = [10000, 5000, 20000, 15000, 8000];
const tabCodes   = ["1234", "5678", "1111", "2222", "3333"]; // codes secrets liés aux numéros
let numCourant = null;

// =======================
// Traductions
// =======================
let T = {};
let langueCourante = "fr";
let traductionsChargees = false;

$.ajaxSetup({ cache: false });

// =======================
// Chargement des traductions
// =======================
function parseKV(text) {
  const out = {};
  text.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    out[key] = val.replace(/\\n/g, "\n");
  });
  return out;
}

function chargerLangue(lang) {
  return $.ajax({
    url: `donnees_${lang}.txt`,
    dataType: "text"
  }).then(data => {
    const kv = parseKV(data);

    // Construire les blocs texte
    T = {
      menuText: `${kv["menu.title"]}\n${kv["menu.opt1"]}\n${kv["menu.opt2"]}\n${kv["menu.opt3"]}\n${kv["menu.opt4"]}\n\n${kv["menu.prompt"]}`,
      optionsText: `${kv["options.title"]}\n${kv["options.opt1"]}\n${kv["options.opt2"]}\n${kv["options.opt3"]}\n${kv["options.opt4"]}\n${kv["options.opt5"]}\n${kv["options.opt6"]}\n${kv["options.opt7"]}`,
      factureText: `${kv["facture.title"]}\n${kv["facture.opt1"]}\n${kv["facture.opt2"]}\n${kv["facture.opt3"]}\n${kv["facture.opt4"]}\n${kv["facture.opt5"]}\n${kv["facture.opt6"]}\n${kv["facture.opt7"]}\n${kv["facture.opt8"]}\n${kv["facture.opt9"]}\n${kv["facture.opt10"]}\n${kv["facture.opt11"]}`,
      msg: {
        balance: kv["msg.balance"],
        codeIncorrect: kv["msg.codeIncorrect"],
        transfertOk: kv["msg.transfertOk"],
        transfertErreur: kv["msg.transfertErreur"],
        auRevoir: kv["msg.auRevoir"]
      },
      prompt: {
        code: kv["prompt.code"],
        dest: kv["prompt.dest"],
        montant: kv["prompt.montant"],
        retourMenu: kv["prompt.retourMenu"]
      },
      optionsReply: {
        transactions: kv["options.reply.transactions"],
        modifCode: kv["options.reply.modifCode"],
        statut: kv["options.reply.statut"],
        inscription: kv["options.reply.inscription"],
        resetCode: kv["options.reply.resetCode"],
        unknown: kv["options.reply.unknown"]
      },
      facturePrompt: {
        code: kv["facture.promptCode"],
        montant: kv["facture.promptMontant"],
        confirm: kv["facture.confirm"]
      },
      // Prompts spécifiques à la modification du code secret
      changeCode: {
        old: kv["change.oldPrompt"],
        new1: kv["change.newPrompt"],
        new2: kv["change.confirmPrompt"],
        success: kv["change.success"],
        mismatch: kv["change.mismatch"],
        weak: kv["change.weak"]
      }
    };

    langueCourante = lang;
    traductionsChargees = true;
    $("#output").text("Langue changée en " + lang.toUpperCase());
  }).catch(err => {
    traductionsChargees = false;
    $("#output").text("Erreur de chargement de la langue: " + lang);
    console.error(err);
  });
}


function menuPrincipal() {
  const rep = prompt(T.menuText);
  return rep ? rep.trim().charAt(0) : "";
}

function retourMenu() {
  const retour = confirm(T.prompt.retourMenu);
  if (retour) main();
  else alert(T.msg.auRevoir);
}

// Solde
function afficherSolde() {
  const i = tabNumeros.indexOf(numCourant);
  const code = prompt(T.prompt.code);
  if (code === tabCodes[i]) {
    alert(T.msg.balance + tabSoldes[i]);
  } else {
    alert(T.msg.codeIncorrect);
  }
  retourMenu();
}

// Transfert
function transfertArgent() {
  const i = tabNumeros.indexOf(numCourant);
  const dest = prompt(T.prompt.dest);
  const montant = parseInt(prompt(T.prompt.montant), 10);
  const code = prompt(T.prompt.code);
  const frais = 500;

  if (code !== tabCodes[i] || !Number.isFinite(montant) || montant <= 0 || montant + frais > tabSoldes[i] || !tabNumeros.includes(dest)) {
    alert(T.msg.transfertErreur);
  } else {
    const j = tabNumeros.indexOf(dest);
    tabSoldes[i] -= montant + frais;
    tabSoldes[j] += montant;
    alert(T.msg.transfertOk + tabSoldes[i]);
  }
  retourMenu();
}

// Options (sous-menu)
function menuOptions() {
  const choix = prompt(T.optionsText);
  const c = choix ? choix.trim().charAt(0) : "";
  const i = tabNumeros.indexOf(numCourant);

  switch (c) {
    case "1":
      alert(T.msg.balance + tabSoldes[i]);
      break;
    case "2":
      alert(T.optionsReply.transactions);
      break;
    case "3":
      changerCodeSecret();
      return; // changerCodeSecret gère déjà le retour au menu
    case "4":
      alert(T.optionsReply.statut);
      break;
    case "5":
      alert(T.optionsReply.inscription);
      break;
    case "6":
      alert(T.optionsReply.resetCode);
      break;
    default:
      alert(T.optionsReply.unknown);
  }
  retourMenu();
}


function changerCodeSecret() {
  const i = tabNumeros.indexOf(numCourant);

  const ancien = prompt(T.changeCode.old);
  if (ancien === null) { retourMenu(); return; }
  if (ancien !== tabCodes[i]) {
    alert(T.msg.codeIncorrect);
    retourMenu();
    return;
  }

  const nouveau = prompt(T.changeCode.new1);
  if (nouveau === null) { retourMenu(); return; }


  const isDigits = /^\d{4,6}$/.test(nouveau);
  if (!isDigits) {
    alert(T.changeCode.weak);
    retourMenu();
    return;
  }

  const confirmation = prompt(T.changeCode.new2);
  if (confirmation === null) { retourMenu(); return; }
  if (nouveau !== confirmation) {
    alert(T.changeCode.mismatch);
    retourMenu();
    return;
  }


  tabCodes[i] = nouveau;
  alert(T.changeCode.success);
  retourMenu();
}


function menuFacture() {
  const choix = prompt(T.factureText);
  if (!choix) { retourMenu(); return; }
  const service = choix.trim().charAt(0);


  const identifiant = (service === "1")
    ? prompt("Entrer le numéro fixe :")
    : prompt(T.facturePrompt.code);

  if (identifiant === null || identifiant.trim() === "") {
    alert(T.msg.transfertErreur);
    retourMenu();
    return;
  }

  const montant = prompt(T.facturePrompt.montant);
  if (montant === null || isNaN(parseInt(montant, 10)) || parseInt(montant, 10) <= 0) {
    alert(T.msg.transfertErreur);
    retourMenu();
    return;
  }

  alert(`${T.facturePrompt.confirm}\nService: ${choix}\nRéférence: ${identifiant}\nMontant à payer: ${montant} FCFA`);
  retourMenu();
}


function main() {
  if (!traductionsChargees) {
    chargerLangue(langueCourante).then(() => lancerFlux());
  } else {
    lancerFlux();
  }
}

function lancerFlux() {
  numCourant = $("#num").val();
  const choix = menuPrincipal();

  if (choix === "1") {
    afficherSolde();
  } else if (choix === "2") {
    transfertArgent();
  } else if (choix === "3") {
    menuFacture();
  } else if (choix === "4") {
    menuOptions();
  } else {
    $("#output").text("Service non encore implémenté.");
    retourMenu();
  }
}


$(document).ready(function() {
  // Remplir le select des numéros
  tabNumeros.forEach(num => $("#num").append(`<option value="${num}">${num}</option>`));

  // Charger langue par défaut
  chargerLangue(langueCourante);

  // Changement de langue
  $("#langue").on("change", () => {
    const lang = $("#langue").val();
    chargerLangue(lang);
  });

  // Bouton USSD
  $("#btn221").on("click", () => main());
});
