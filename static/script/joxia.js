/* ============================================================
   Intégration Joxia pour Pac-Man (jeu original de Haole Zheng, MIT)
   Ajoute UNIQUEMENT : pseudo du hub + classement Firebase + contrôles tactiles.
   Le moteur du jeu n'est pas modifié (hormis 1 ligne d'accroche du score).
   ============================================================ */
(function () {
  // --- Firebase (base commune Joxia) ---
  var firebaseConfig = {
    apiKey: "AIzaSyCPecKQH6DURfYitjY4bXMeW0URLrcNnsI",
    authDomain: "joxiahub-2928b.firebaseapp.com",
    databaseURL: "https://joxiahub-2928b-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "joxiahub-2928b",
    storageBucket: "joxiahub-2928b.firebasestorage.app",
    messagingSenderId: "303698595695",
    appId: "1:303698595695:web:5c99c2cb2a9ea88e36a29a"
  };
  var db = null;
  try { if (!firebase.apps.length) firebase.initializeApp(firebaseConfig); db = firebase.database(); }
  catch (e) { console.warn("Firebase indisponible", e); }

  var params = new URLSearchParams(location.search);
  var player = params.get("player");
  var tag = document.getElementById("joxia-player");
  if (tag) tag.textContent = player && player !== "null" ? player : "Invité";

  // --- sauvegarde du meilleur score ---
  var bestSaved = 0;
  function saveScore(score) {
    if (!db || !player || player === "null" || score <= 0 || score <= bestSaved) return;
    bestSaved = score;
    var path = "games/PACMAN/scores";
    db.ref(path).orderByChild("name").equalTo(player).once("value", function (snap) {
      var val = snap.val();
      if (val) {
        var k = Object.keys(val)[0];
        if (Number(score) > Number(val[k].score)) db.ref(path + "/" + k).update({ score: Number(score), date: Date.now() });
      } else {
        db.ref(path).push({ name: player, score: Number(score), date: Date.now() });
      }
    });
  }
  // accroche appelée par le moteur à l'écran de fin
  window.__pacOver = function (finalScore) { saveScore(finalScore); };

  // --- contrôles tactiles (swipe = flèches, tap = espace) ---
  function press(code) {
    var e = new KeyboardEvent("keydown", { bubbles: true });
    try { Object.defineProperty(e, "keyCode", { get: function () { return code; } });
          Object.defineProperty(e, "which", { get: function () { return code; } }); } catch (_) {}
    window.dispatchEvent(e);
  }
  var sx = 0, sy = 0, moved = false;
  var cv = document.getElementById("canvas");
  if (cv) {
    cv.addEventListener("touchstart", function (e) {
      var t = e.touches[0]; sx = t.clientX; sy = t.clientY; moved = false;
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
    cv.addEventListener("touchmove", function (e) { if (e.cancelable) e.preventDefault(); }, { passive: false });
    cv.addEventListener("touchend", function (e) {
      var t = (e.changedTouches && e.changedTouches[0]) || {};
      var dx = (t.clientX || sx) - sx, dy = (t.clientY || sy) - sy;
      var ax = Math.abs(dx), ay = Math.abs(dy);
      if (ax < 24 && ay < 24) { press(32); }            // tap -> espace (démarrer/pause/rejouer)
      else if (ax > ay) { press(dx > 0 ? 39 : 37); }     // droite / gauche
      else { press(dy > 0 ? 40 : 38); }                  // bas / haut
      if (e.cancelable) e.preventDefault();
    }, { passive: false });
  }
})();
