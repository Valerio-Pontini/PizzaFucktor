# Pizza Fucktor — backlog e analisi funzionale dell’upgrade grafico

Audit eseguito il 21 novembre 2026 sull’app locale, seguendo il percorso pubblico e una sessione tecnica autenticata.

## Direzione

Trasformare Pizza Fucktor in una **tavolata illustrata esplorabile**: ogni schermata diventa un piccolo diorama, la navigazione diventa un movimento di macchina e i personaggi delle squadre diventano attori ricorrenti.

Il flusso resta invariato: autenticazione, creazione/ingresso nella squadra, inserimento pizzeria, calendario, dettaglio locale, voto, storico e classifica continuano a usare gli stessi dati e gli stessi endpoint.

## Come usare questo documento

Questo file è il riferimento operativo per ogni incremento futuro. La parte **Analisi delle scene** descrive la direzione artistica e funzionale; il **Backlog operativo** contiene il lavoro ordinato da eseguire.

Per ogni incremento di sviluppo bisogna:

1. scegliere uno o più item dal backlog rispettando priorità e dipendenze;
2. implementare la scena senza modificare il flusso funzionale o gli endpoint esistenti;
3. verificare la resa reale in browser su desktop e mobile, con screenshot;
4. eseguire build e test automatici;
5. aggiornare in questo file stato, note, asset prodotti e prossimo passo.

Stati ammessi: `⬜ Da fare`, `◐ In corso`, `✅ Completato`, `⏸ Bloccato`.

## Requisito trasversale: da dashboard a vero gioco illustrato

L’obiettivo non è soltanto aggiungere illustrazioni dentro l’interfaccia attuale. Va eliminato il mood da dashboard composto da riquadri, pannelli e card che contengono le scene. L’app deve comportarsi come un piccolo gioco narrativo esplorabile.

### Principi UX/UI non negoziabili

- La **scena è il contenitore primario**: occupa il viewport e gli elementi UI sono parte del mondo, non card appoggiate sopra un pannello.
- La navigazione diventa una **mappa del giro** o un HUD leggero: percorso, stato della sfida e ritorno sono persistenti ma visivamente secondari.
- Le azioni principali vivono in **hotspot, oggetti e personaggi**: porta, pizza, clipboard, calendario, insegna, ticket e polaroid sostituiscono i pulsanti generici quando il contesto lo permette.
- I riquadri sono ammessi solo quando rappresentano un oggetto diegetico — menu, lettera, ticket, clipboard, foto — oppure un overlay necessario per una decisione. Non devono essere la griglia strutturale della pagina.
- Ogni cambio vista deve sembrare uno **spostamento di camera**: push-in, pull-back, pan, match-cut o apertura di un oggetto; mai un semplice cambio di pannello senza continuità visiva.
- Il testo operativo resta leggibile e accessibile, ma viene integrato nella scena con insegne, didascalie, fumetti, ticket e micro-HUD.
- La stessa grammatica vale su mobile: la scena si adatta e non viene ridotta a una colonna di card.

### Criteri di accettazione UX trasversali

- `UX-01`: ogni vista principale ha una scena dominante, senza una successione di riquadri illustrati come layout principale.
- `UX-02`: il percorso avanti/indietro conserva stato, dati e posizione narrativa; il tasto browser back non resetta la sessione.
- `UX-03`: ogni hotspot importante ha un nome accessibile, focus visibile e alternativa testuale; il gioco resta utilizzabile da tastiera e screen reader.
- `UX-04`: le transizioni rispettano `prefers-reduced-motion` e non bloccano l’azione funzionale.
- `UX-05`: ogni scena viene controllata in almeno un viewport desktop e uno mobile con screenshot archiviato.
- `UX-06`: nessun cambio di scena richiede nuove API o modifica dei dati già usati dall’app.

## Stato dell’upgrade già realizzato

Gli incrementi già presenti nel codice vanno considerati baseline, non nuove proposte:

- `✅` sistema `CharacterActor` data-driven con pose idle/cheer e animazione CSS;
- `✅` 10 asset trasparenti v2 per le cinque coppie;
- `✅` `SceneShell` comune con HUD di orientamento, progresso, ritorno e animazione d’ingresso;
- `✅` piazza trasformata in scena dominante full-scene desktop/mobile;
- `✅` transizione piazza → facciata → soglia → interno, con ritorno HUD e stato della tappa conservati;
- `✅` backstage con personaggi direttamente selezionabili nella creazione squadra;
- `✅` piazza con mappa senza badge circolari, attori ancorati agli ingressi e hotspot sulle coppie;
- `✅` coppia Grano/gialla sempre visibile anche quando lo slot è libero, con stato non interattivo;
- `⬜` eliminazione completa della struttura dashboard dalle viste Tappe, Voti, Storico, Squadra e Classifica.

### Registro incremento 04 — audit di integrazione visuale

Lo screenshot audit desktop ha isolato tre punti in cui le viste sembravano ancora pagine editoriali separate dalla piazza:

- **Tappe**: spazio vuoto non caratterizzato; aggiunto un calendario/set-piece “IL GIRO” che occupa la scena senza diventare una card di dashboard.
- **Voti**: spazio vuoto e gerarchia poco ancorata; aggiunti il personaggio della squadra nel titolo e il piatto “IL PIATTO DEI VERDETTI” come elemento diegetico di scena.
- **Squadra**: il badge era ancora il solo elemento identitario; aggiunta la coppia hero della squadra nella scena, mantenendo codice, membri, nome e pizzeria invariati.

Screenshot di verifica archiviati in `artifacts/visual-audit/upgrade-04/`:
`02d-tappe-fixed.png`, `03d-voti-fixed.png`, `04d-squadra-fixed.png`.

Questo incremento rende più coerente la grammatica comune e prepara la chiusura di `SCN-06` con gli stati avanzati del calendario e della roulette.

### Registro incremento 05 — calendario interattivo

`SCN-06` è ora **in corso** con il primo incremento funzionale completo:

- le tappe sono tessere-calendario diegetiche, con data, stato prenotazione, coppia e personaggi associati;
- il click sulla tessera apre direttamente la facciata della pizzeria, senza cambiare il flusso dati;
- il voto resta un’azione separata e accessibile nella parte bassa della tessera;
- le pizzerie senza data hanno uno stato “in attesa” riconoscibile, con data vuota e personaggio attenuato;
- il piatto roulette estrae una tappa, mostra la coppia e consente di aprirla;
- il layout è stato verificato a `1440×1200` e `390×844`, senza overflow orizzontale.
- dopo il controllo visivo, la roulette CSS è stata sostituita da un piatto reale con pizza a cinque gusti e ticket illustrato, coerente con la mappa e con le tessere calendario.
- secondo audit visivo: corretta la scala del canvas trasparente della pizza e uniformata la tipografia del ticket alla famiglia globale dell’app.
- terzo audit semantico: sostituita la base della pizza-mappa con `vote-kit/common/plate_transition.webp`, così l’oggetto rappresenta un piatto e non una pizza cruda sotto la pizza cotta.
- quarto audit geometrico: riallineato il gruppo piatto + ticket sull’asse della scena desktop e verificata la composizione a due colonne su mobile.
- quinto audit tipografico: rimossi i font serif residui dal contatore tappe e dai numeri calendario; ora la pagina usa la famiglia globale arrotondata.
- sesto audit gerarchico: uniformato il peso dei titoli “Chi tocca dopo?” e “Le tessere ancora da fissare.” a quello dei titoli principali della scena.

Screenshot archiviati in `artifacts/visual-audit/upgrade-05/`:
`09-tappe-piatto-idle-desktop.png`, `10-tappe-piatto-result-desktop.png`, `08-tappe-piatto-mobile.png`, `02-tappa-opened-desktop.png`.

### Registro incremento 06 — scheda voto con coppia in scena

`SCN-07` è ora **completato**:

- la scheda voto riceve `teamSlot` e mostra la coppia corretta accanto al banco, usando gli asset personaggio già presenti e una posa coerente con lo stato del giudizio;
- il fumetto diegetico cambia tra `ASSAGGIO IN CORSO`, `IL GIUDIZIO PRENDE FORMA` e `PRONTO DA SIGILLARE` in base alle categorie compilate;
- il personaggio passa da `tasting` a `peek` e `cheer` senza cambiare il flusso, i dati o le API di voto;
- ogni categoria completata riceve un check animato e una lieve evidenziazione, mentre il pulsante resta disabilitato fino a cinque categorie valutate;
- su mobile la coppia entra sopra la clipboard in una fascia compatta, con `scrollWidth - innerWidth = 0` verificato a `390×844`;
- l’invio conserva la sequenza esistente e, al ritorno su Voti, attiva un breve arrivo della classifica con messaggio diegetico e piatto che rientra in scena;
- l’audit non ha inviato un voto reale dell’account: la fase `sealing` è stata riprodotta in browser senza mutare dati, mentre la semantica di salvataggio continua a essere coperta dai test API.

Screenshot archiviati in `artifacts/visual-audit/upgrade-06/`:
`02-scheda-voto-companion-desktop.png`, `03-scheda-voto-companion-mobile.png`, `04-scheda-voto-progress-desktop.png`.

### Registro incremento 07 — busta verso il piatto dei verdetti

La chiusura di `SCN-07` porta la consegna del voto dentro la stessa grammatica di scena:

- durante `sealing`, il sigillo compare sul tavolo, segue una traiettoria tratteggiata e raggiunge il cartellino `IL PIATTO DEI VERDETTI · classifica aggiornata`;
- il messaggio “Verdetto sigillato!” è stato riallineato sopra il pulsante, evitando sovrapposizioni anche su desktop;
- il ritorno alla vista Voti usa `SceneShell[data-arrival="verdict"]`, anima il piatto diegetico e mostra la pillola “Verdetto appena sigillato · classifica aggiornata”;
- il target viene ridisposto su mobile sopra il dialogo della coppia, con `scrollWidth - innerWidth = 0` verificato a `390×844`;
- la riduzione del moto mantiene il sigillo e il cartellino visibili senza dipendere dalle animazioni.

Screenshot archiviati in `artifacts/visual-audit/upgrade-07/`:
`03-sealing-handoff-desktop-fixed.png`, `05-sealing-handoff-mobile-fixed.png`, `07-voti-arrival-desktop-fixed.png`, `08-voti-arrival-mobile.png`.

### Registro incremento 08 — album dei ricordi

`SCN-08` è ora **completato**:

- lo storico dei voti è diventato un album di polaroid con pagina materica, clip, foto della coppia e sigillo `SIGILLATO`;
- ogni ricordo mantiene pizzeria, indirizzo, data, punteggio totale, dettaglio delle cinque categorie e nota del giudice;
- la coppia della squadra viene mostrata nella foto con una posa coerente, senza alterare dati o API;
- quando non esistono voti compare una pagina vuota illustrata con CTA `Lascia il primo verdetto`, collegata alla vista Voti;
- il layout è stato verificato su desktop e mobile, con un’anteprima popolata non persistente per controllare proporzioni, leggibilità e assenza di overflow;
- reduced-motion conserva la composizione e le informazioni, rimuovendo solo l’ingresso animato delle schede.

Screenshot archiviati in `artifacts/visual-audit/upgrade-08/`:
`02-album-empty-desktop.png`, `03-album-empty-mobile.png`, `06-album-populated-desktop-fixed.png`, `07-album-populated-mobile.png`.

### Registro incremento 09 — podio e gran finale

`SCN-09` è ora **completato**:

- la classifica provvisoria ha un podio centrale da tavola, con luce, pedane, coppia in testa e posti ancora da assegnare;
- le squadre senza voto restano visibili nella fascia `IN ATTESA DEL PRIMO VERDETTO`, senza essere forzate in una posizione numerica;
- la scena finale prevede le prime tre coppie sul podio, il coro delle cinque coppie e la fetta-premio della vincitrice;
- la lista completa, i punteggi, il numero di voti e i pulsanti di voto restano invariati sotto la scena;
- il layout è stato verificato su desktop e mobile, con `scrollWidth - innerWidth = 0` a `390×844`;
- reduced-motion mantiene podio, personaggi e informazioni visibili con `animation: none`;
- l’anteprima finale a cinque coppie è stata riprodotta nel browser senza modificare i dati dell’edizione.

Screenshot archiviati in `artifacts/visual-audit/upgrade-09/`:
`00-classifica-baseline-desktop.png`, `01-podium-provisional-desktop.png`, `03-podium-provisional-mobile-stage-fixed.png`, `04-podium-final-desktop-preview-fixed.png`.

### Registro incremento 10 — bacheca della squadra

`SCN-10` è ora **completato**:

- Gestisci squadra è diventato una scena unica ambientata nel retro del forno, con fondale cucina, frigo illustrato e foto della coppia;
- nome della squadra, membri, stato `Tu`, codice invito e condivisione sono stati ricomposti come oggetti della bacheca;
- quando manca il secondo componente, la foto mostra uno spazio esplicito `In attesa del compagno` senza alterare il modello dati;
- il campo per rinominare la squadra resta editabile nel ticket della scena e la proposta pizzeria resta un hotspot in-world;
- il passaggio squadra → proposta pizzeria → ritorno alla squadra è stato verificato nel browser;
- desktop e mobile sono stati osservati con screenshot, con `scrollWidth - innerWidth = 0` a `390×844`.

Screenshot archiviati in `artifacts/visual-audit/upgrade-10/`:
`00-squadra-baseline-desktop.png`, `01-fridge-team-desktop-fixed.png`, `02-fridge-team-mobile.png`, `03-fridge-team-mobile-lower.png`.

### Registro incremento 11 — calendario e roulette completati

`SCN-06` è ora **completato**:

- il calendario è una superficie cartacea unica, con legenda e tessere organizzate per stato: `DATA DA FISSARE`, prenotata e `SERATA PASSATA`;
- le tessere mantengono data, pizzeria, coppia, accesso alla facciata, voto e modifica della tappa senza cambiare il flusso dati;
- la roulette è diventata un oggetto stabile da tavola in legno, con piatto, ticket e risultato integrati nella scena;
- il risultato della roulette conserva il CTA `Apri la tappa` e apre la facciata della pizzeria corretta;
- desktop e mobile sono stati osservati con screenshot, con `scrollWidth - innerWidth = 0` a `390×844`;
- reduced-motion rimuove la rotazione ma conserva piatto, ticket, testo e azioni leggibili.

Screenshot archiviati in `artifacts/visual-audit/upgrade-06/`:
`00-calendar-baseline-desktop.png`, `01-calendar-scene-desktop-fixed.png`, `02-calendar-scene-mobile.png`, `03-calendar-scene-mobile-lower.png`.

### Registro incremento 12 — attraversamento della soglia

`SCN-04` è ora **completato**:

- la facciata mantiene coppia, insegna, stato della tappa e hotspot porta, ma ora dichiara chiaramente l’azione con `TOCCA LA PORTA PER ENTRARE`;
- durante l’apertura la camera fa push sulla soglia, le ante si separano e compare il feedback diegetico `ATTRAVERSA LA SOGLIA`;
- il passaggio al tavolo interno usa un secondo arrivo coerente, con una breve maschera porta e il copy `DENTRO LA PIZZERIA`, evitando l’effetto cambio pagina;
- il contesto selezionato resta invariato e la tavolata conserva menu, voto, foto/appunti e azioni esistenti;
- desktop e mobile sono stati osservati con screenshot, con `scrollWidth - innerWidth = 0` a `390×844`;
- reduced-motion elimina maschera e movimento, lasciando immediatamente disponibili interno, hotspot e ritorno alla facciata.

Screenshot archiviati in `artifacts/visual-audit/upgrade-11/`:
`02-piazza-before-desktop.png`, `05-facade-after-desktop.png`, `06-threshold-opening-desktop.png`, `07-interior-arrival-desktop.png`, `08-facade-mobile.png`, `09-threshold-opening-mobile.png`, `11-interior-mobile-stable.png`.

### Registro incremento 13 — tavolata interattiva

`SCN-05` è ora **completato**:

- la tavolata dichiara il gesto di gioco con `TOCCA UN OGGETTO` e porta l’utente direttamente su tre oggetti fisici: clipboard/menu, pizza e foto;
- clipboard e polaroid hanno hotspot sempre leggibili, halo di orientamento e feedback focus/hover, senza aggiungere una griglia di card sopra l’illustrazione;
- menu e foto aprono i dialoghi già esistenti come layer della tavola, mentre la pizza conserva lo stato votabile/non votabile in base alla presenza della pizzeria;
- il testo visivo è stato accorciato e riallineato su mobile per evitare sovrapposizioni, mantenendo le descrizioni complete nelle azioni accessibili e nella legenda;
- desktop e mobile sono stati osservati con screenshot, con `scrollWidth - innerWidth = 0` a `390×844`;
- reduced-motion rimuove pulse e animazioni, lasciando hotspot, label e dialoghi immediatamente disponibili.

Per questo incremento non servivano nuovi raster: la scena usa gli asset `tavolo-serata/*` esistenti e li rende interattivi con layer CSS coerenti.

Screenshot archiviati in `artifacts/visual-audit/upgrade-12/`:
`01-tavolata-baseline-stable-desktop.png`, `08-tavolata-final-desktop.png`, `09-tavolata-final-mobile.png`, `10-tavolata-final-mobile-stage.png`, `03-menu-dialog-desktop.png`, `04-diary-dialog-desktop.png`.

### Registro incremento 14 — piazza hub viva

`SCN-03` è ora **completato**:

- la piazza conserva l’illustrazione unica e le cinque coppie ancorate, ma ora ha micro-loop separati per fumo dei comignoli, luci calde, tavolata e percorso centrale;
- ogni pizzeria occupata ha un hotspot trasparente direttamente sull’edificio, con label `Apri la facciata` e alternativa accessibile, senza obbligare a cliccare prima il personaggio;
- focus e selezione rendono leggibile l’ingresso scelto senza coprire la scena, mentre i personaggi restano hotspot equivalenti;
- i cinque slot, inclusa la coppia gialla, restano nella stessa composizione e i posti vuoti continuano a essere non interattivi;
- desktop e mobile sono stati osservati con screenshot, con `scrollWidth - innerWidth = 0` a `390×844`;
- reduced-motion spegne fumo, bagliori, respiro del tavolo e shimmer del percorso, lasciando mappa, hotspot e click diretto funzionanti.

Per questo incremento non servivano nuovi raster: sono stati riutilizzati `piazza-map-five-v2.png` e gli attori `CharacterActor`, aggiungendo solo layer ambientali CSS.

Screenshot archiviati in `artifacts/visual-audit/upgrade-13/`:
`00-piazza-baseline-desktop.png`, `01-piazza-ambient-desktop.png`, `03-piazza-entrance-focus-fixed.png`, `04-piazza-mobile-map.png`, `05-piazza-mobile-entrance-focus.png`.

### Registro incremento 15 — backstage della squadra

`SCN-02` è ora **completato**:

- il backstage è diventato la scena dominante della creazione squadra, con fondale cucina, capitolo, area personaggi e selezione diegetica;
- i cinque personaggi sono hotspot diretti: il click sulla figura pilota la stessa selezione del badge, senza introdurre un nuovo flusso o endpoint;
- ogni personaggio espone nome e stato contestuale (`Tocca per scegliere`, `Scelta`, `Già in gara`), con focus tastiera e alternativa accessibile;
- nome dell’utente e nome della coppia vengono richiamati nell’overlay della scena quando esiste una selezione;
- il form non è più il contenitore primario: scena e briefing vengono prima, nome/badge/invito seguono come banco operativo sotto la scena;
- su desktop la scena è stata verificata a `1440×1200`, su mobile a `390×844`; la composizione non introduce overflow orizzontale;
- reduced-motion conserva personaggi, hotspot e stato di selezione disattivando arrivo fondale e vapore;
- non sono serviti nuovi raster: sono stati riutilizzati `backstage/backstage-kitchen.png`, `CharacterActor` e il pacchetto asset v2, aggiungendo solo layer CSS/UI contestuali.
- correzione palette post-audit: gli asset Oliva ora usano grembiuli, fasce, finiture e strisce scarpe viola in `olive_idle.png`, `olive_cheer.png` e `olive_couple.webp`, coerenti con `#80549D / #563471` già usato dalla scena del verdetto.

Screenshot archiviati in `artifacts/visual-audit/upgrade-14/`:
`00-backstage-baseline-desktop.png`, `01-backstage-baseline-mobile.png`, `02-backstage-upgraded-desktop.png`, `03-backstage-upgraded-mobile.png`.

### Registro incremento 16 — palette delle pizzerie in piazza

`SCN-03` riceve un aggiornamento di coerenza cromatica:

- il fondale `piazza-map-five-v2.png` ora assegna una tenda riconoscibile a ogni pizzeria: Pomodoro rosso, Basilico verde, Grano oro, Olive viola e Mozzarella blu;
- gli ingressi ricevono piccoli richiami nello stesso colore senza alterare tavolo centrale, percorso, paesaggio o illuminazione generale;
- la configurazione cromatica è stata centralizzata in `TEAM_BADGES` e riutilizzata da hotspot pizzeria, focus personaggio, label e legenda;
- lo stato selezionato non usa più un alone giallo generico: ogni pizzeria reagisce con il proprio colore di squadra;
- desktop e mobile sono stati osservati con screenshot; a `390×844` lo `scrollWidth` resta pari a `390px`.

Screenshot archiviati in `artifacts/visual-audit/upgrade-16/`:
`00-piazza-team-colors-desktop.png`, `01-piazza-olive-focus-desktop.png`, `02-piazza-team-colors-mobile.png`.

### Registro incremento 17 — lancio backstage → piazza

`UX-04` è ora **completato** per il percorso di ingresso nel giro:

- dopo creazione o ingresso nella squadra, il ritorno alla piazza conserva browser history, dati e team appena sincronizzato;
- il badge della squadra diventa un oggetto di continuità nella scena `SceneShell`, con overlay `IL GIRO SI ACCENDE` e breve arrivo animato;
- `selectedPlaceId` viene impostato sul team appena entrato, quindi pizzeria, coppia e hotspot corrispondenti si accendono nella mappa senza un nuovo click;
- la transizione usa la palette del team e non introduce nuovi endpoint o modifiche al modello dati;
- con `prefers-reduced-motion` l’overlay viene rimosso, ma piazza, selezione e navigazione restano immediatamente disponibili;
- il controllo desktop/mobile è stato eseguito con una fixture di arrivo non persistente, perché l’edizione locale aveva già cinque squadre occupate.

Screenshot archiviati in `artifacts/visual-audit/upgrade-17/`:
`00-piazza-before-launch-desktop.png`, `01-team-launch-desktop.png`, `02-team-launch-mobile.png`.

### Registro incremento 18 — manifest unico team → asset → posa → posizione → azione

`SYS-01` è ora **completato**:

- `app/team-manifest.ts` è la fonte unica per identità, palette, badge, asset di facciata, coppia, tavolata, pose, action alias e ancoraggi della piazza;
- `CharacterActor` risolve l’asset dal manifest e accetta action semantiche come `mapSelected`, `calendarWaiting`, `historyMemory` e `winner`;
- piazza, backstage, calendario, storico, tavolata, podio, ruota e facciata usano la configurazione condivisa senza mapping manuali locali;
- il caso Grano mantiene correttamente la corrispondenza `grano` → asset/tema `farina`, mentre Olive conserva tema, grembiuli e facciata viola;
- al momento dell’incremento le pose `peek` e `tasting` erano ancora fallback espliciti su `idle`; sono state completate con il successivo incremento `SYS-02`;
- non sono cambiati endpoint, modello dati, flusso di navigazione o comportamento funzionale.

Audit browser eseguito su desktop e mobile; verificata anche l’apertura reale della facciata Olive e dei suoi asset viola.

Screenshot archiviati in `artifacts/visual-audit/upgrade-18/`:
`00-piazza-manifest-desktop.png`, `01-piazza-manifest-mobile.png`, `02-olive-entrance-manifest.png`.

### Registro incremento 19 — pulizia hotspot della scena piazza

Rifinitura visuale di `SCN-03` completata:

- rimossi i riquadri testuali sopra pizzerie e personaggi, che duplicavano informazioni già leggibili dall’illustrazione;
- rimossa la legenda a tessere sotto la mappa, per evitare il ritorno a una composizione da dashboard;
- mantenuti cinque hotspot invisibili sulle pizzerie e cinque pulsanti personaggio, tutti ancora cliccabili e con `aria-label` contestuale;
- l’hotspot della pizzeria mostra solo un piccolo indicatore circolare colorato su hover, focus o selezione;
- la scena mobile non introduce più la griglia di riquadri sotto la piazza.

Audit browser: `labels = 0`, `key = 0`, `pizzeriaButtons = 5`, `characterButtons = 5`.

Screenshot archiviati in `artifacts/visual-audit/upgrade-19/`:
`00-piazza-clean-desktop.png`, `01-piazza-clean-mobile.png`.

### Registro incremento 20 — pose `peek` e `tasting` dedicate

`SYS-02` è avanzato con il primo pacchetto di pose reali:

- generate 10 asset trasparenti, uno `peek` e uno `tasting` per ciascuna coppia: Pomodoro, Basilico, Grano/Farina, Olive e Mozzarella;
- tutti i file sono in `public/assets/pizzeria-entrance/characters/v2/`, con naming coerente e tela RGBA `1122×1402`;
- `team-manifest.ts` ora punta ai file dedicati, quindi calendario, storico vuoto, tavolata e reazioni di attesa non riusano più `idle`;
- i colori di squadra, inclusi i grembiuli viola di Olive, restano vincolati al riferimento esistente;
- verificata la resa browser: `peek` nel calendario e `tasting` nella tavolata, su desktop e mobile, senza salti di scala o trasparenze errate;
- restano da completare le pose solo previste dal pacchetto completo `SYS-02`.

Screenshot archiviati in `artifacts/visual-audit/upgrade-20/`:
`00-calendar-peek-desktop.png`, `01-calendar-peek-mobile.png`, `02-tasting-table-desktop.png`, `03-tasting-table-mobile.png`.

### Registro incremento 21 — coppia hero, sorpresa e silhouette

`SYS-02` è avanzato con il secondo pacchetto di pose reali:

- generate 5 coppie `hero` e 5 coppie `surprise`, una per ogni squadra; i file sono trasparenti, RGBA `1122×1402` e allineati alla stessa baseline delle pose precedenti;
- la facciata della pizzeria ora usa la nuova coppia `hero`, sostituendo il vecchio asset statico della coppia e mantenendo il tema cromatico di ogni squadra;
- il giudizio passa alla posa `surprise` quando sono state compilate almeno tre categorie, mentre `tasting` resta lo stato iniziale e `cheer` quello di chiusura;
- la gestione squadra integra `companion_silhouette.png` per il posto ancora libero e usa la coppia `hero` quando i due membri sono presenti;
- il manifest centrale è stato esteso con le pose e le action alias `teamHero` / `judgmentSurprise`; sono state aggiunte animazioni CSS dedicate per hero e sorpresa;
- osservata la resa browser su desktop e mobile: la facciata non ha overflow a `390×844`, la coppia hero resta centrata e il giudizio renderizza realmente `mozzarella_surprise.png` dopo tre categorie.

Screenshot archiviati in `artifacts/visual-audit/upgrade-21/`:
`00-entrance-hero-desktop.png`, `01-team-board-hero-desktop.png`, `02-entrance-hero-mobile.png`, `03-judgment-surprise-desktop.png`, `04-judgment-surprise-focus.png`.

### Registro incremento 22 — personaggi singoli `solo_a` / `solo_b`

`SYS-02` è ora **completato**:

- generate 10 nuove illustrazioni singole trasparenti: due per squadra (`solo_a` e `solo_b`) per Pomodoro, Basilico, Grano/Farina, Olive e Mozzarella;
- ogni asset è stato normalizzato su tela RGBA `1122×1402`, con piedi completi, baseline coerente e naming stabile in `public/assets/pizzeria-entrance/characters/v2/`;
- `CharacterActor` ora può ricevere `solo="a" | "b"` e risolve il file dal manifest centrale, senza mapping locali nei componenti;
- il backstage usa già il personaggio singolo `solo_a`, evitando di mostrare una coppia compressa dentro ogni hotspot di selezione;
- verificati tutti i 10 URL nel browser: `HTTP 200`; la scena squadra esistente continua a renderizzare la coppia hero senza regressioni;
- i dati, la navigazione, la selezione squadra e il flusso funzionale restano invariati.

Screenshot archiviati in `artifacts/visual-audit/upgrade-22/`:
`00-team-hero-regression-desktop.png`, `01-solo-assets-contact-sheet.png`.

### Registro incremento 23 — correzione identità dei single character

Il primo pacchetto `solo_a` / `solo_b` è stato scartato perché, pur rispettando palette e tema, reinterpretava i personaggi e non era sufficientemente associabile alle coppie canoniche della gara.

- i 10 asset sono stati rigenerati usando direttamente le immagini canoniche `*_idle.png` come riferimento di identità;
- ogni output isola un membro specifico della coppia originale, preservando volto, capelli, cappello, emblema, grembiule, accessori, proporzioni e colori;
- i file sostitutivi mantengono naming e tela RGBA `1122×1402`, quindi non richiedono modifiche al manifest o al layout;
- verificato il contact sheet: Pomodoro, Basilico, Grano/Farina, Olive e Mozzarella sono riconoscibili e associabili alle rispettive coppie;
- verificati nel browser tutti i 10 asset: `HTTP 200`, dimensioni `1122×1402`, nessuna regressione nella scena squadra.

Audit aggiornato in `artifacts/visual-audit/upgrade-22/01-solo-assets-contact-sheet.png` e `artifacts/visual-audit/upgrade-23/00-team-regression-desktop.png`.

### Registro incremento 24 — login nel retrobottega

`SCN-11` è ora **completato**:

- la schermata login/registrazione non è più un pannello centrato isolato: ora è una scena full-screen con il retrobottega della pizzeria a sinistra e il ticket cartaceo della sfida a destra;
- riutilizzati gli asset già coerenti `backstage/backstage-kitchen.png` e `login-ticket.webp`, senza introdurre raster ridondanti;
- aggiunti layer diegetici CSS per vapori, luce di finestra, caption di scena e micro-movimenti, con supporto a `prefers-reduced-motion` già ereditato;
- username, password, conferma password, messaggi di errore, submit, login/registrazione e sessione non sono stati modificati;
- verificato nel browser isolato il percorso login → registrazione → ritorno alla mappa, oltre a desktop `1440×1000` e mobile `390×844`;
- verificato `overflow = false` su entrambe le dimensioni e mantenuta la compatibilità con browser history.

Screenshot archiviati in `artifacts/visual-audit/upgrade-24/`:
`00-login-before-desktop.png`, `01-login-after-desktop.png`, `02-login-after-mobile.png`.

### Registro incremento 25 — audit QA finale delle scene

`QA-01` e `QA-02` sono ora **completati**:

- verificati desktop `1440×1000` e mobile `390×844` per Piazza, Tappe, Voti, Storico e Squadra;
- verificati nel browser i passaggi reali Piazza → facciata → tavolata, ritorno, apertura della scheda voto e gestione pizzeria;
- verificati sia il ramo con pizzeria non ancora scelta sia il ramo con pizzeria compilata, mantenendo dati e callback invariati;
- controllati asset mancanti, overflow orizzontale, focus tastiera, nomi accessibili dei controlli e `prefers-reduced-motion`; nessun asset mancante o blocco funzionale rilevato;
- la tavolata è stata ricontrollata dopo la fine della doppia transizione porta → soglia, evitando di confondere il velo scuro di ingresso con un difetto permanente;
- non sono stati inviati voti, modificati dati o alterati endpoint durante il QA;
- `npm test`: 9/9; `npm run build`: completato.

Screenshot e report archiviati in `artifacts/visual-audit/qa-final/`:
`home-desktop.png`, `appointments-desktop.png`, `votes-desktop.png`, `history-desktop.png`, `team-desktop.png`, `home-mobile.png`, `appointments-mobile.png`, `votes-mobile.png`, `history-mobile.png`, `team-mobile.png`, `restaurant-entrance-desktop`, `restaurant-detail-desktop`, `restaurant-detail-populated-desktop`, `judgment-desktop`, `pizzeria-edit-desktop`, `restaurant-entrance-mobile`, `report.json`, `scene-flow-report.json`.

### Registro incremento 26 — polish runtime e breakpoint intermedi

Il polish finale è ora **completato**:

- verificati i breakpoint `1024×768`, `768×1024` e `430×932`, oltre ai viewport desktop/mobile già coperti dal QA;
- verificati testi lunghi nel ticket squadra: il nome resta contenuto senza overflow orizzontale e conserva l’azione di salvataggio;
- convertiti i 41 asset trasparenti delle pose v2 in WebP runtime con alpha preservata e dimensioni `1122×1402`;
- il manifest usa i WebP per idle, cheer, peek, tasting, hero, sorpresa, `solo_a`, `solo_b` e silhouette; i PNG master restano conservati;
- il peso degli asset v2 runtime passa da circa 78 MB a circa 11 MB, senza cambiare identità, palette, proporzioni o baseline dei personaggi;
- gli screenshot post-conversione confermano la resa della piazza, della bacheca squadra e delle coppie colorate.

Screenshot e report archiviati in `artifacts/visual-audit/polish-final/`:
`tablet-landscape-home.png`, `tablet-landscape-appointments.png`, `tablet-landscape-votes.png`, `tablet-landscape-team.png`, `tablet-portrait-home.png`, `tablet-portrait-appointments.png`, `tablet-portrait-votes.png`, `tablet-portrait-team.png`, `mobile-large-home.png`, `mobile-large-appointments.png`, `mobile-large-votes.png`, `mobile-large-team.png`, `tablet-landscape-team-long-name.png`, `report.json`.

## Cosa ho osservato

Il progetto ha già una base visiva molto forte:

- l’intro del forno ha fiamme, fumo, pizza, scintille e zoom d’ingresso;
- la mappa introduttiva assembla la pizza a cinque spicchi e fa entrare i badge;
- il dashboard ha una piazza illustrata con cinque pizzerie;
- l’ingresso della pizzeria ha porte apribili e zoom verso l’interno;
- il dettaglio ha già tavola, pizza, menu, polaroid e hotspot;
- la votazione è una scena completa con clipboard, carta, slider, timbro e busta sigillabile.

Il salto di qualità non richiede di ricominciare da zero: bisogna rendere sceniche anche le viste oggi più editoriali — setup squadra, calendario, storico, gestione squadra e classifica — e collegare tutto con transizioni coerenti.

## Scene proposte

| ID | Scena | Upgrade visivo | Asset da produrre o completare |
|---|---|---|---|
| SCN-00 | **Il forno / apertura** | Conservare la scena attuale. Aggiungere piccoli riflessi, ombre delle cinque squadre e una breve “chiamata” del forno quando il CTA diventa attivo. | Riutilizzare `pizzafactor/*`; aggiungere 5 piccoli emblemi/ombre opzionali e un effetto calore comune. |
| SCN-01 | **La pizza-mappa** | Conservare l’assemblaggio degli spicchi. I badge diventano cinque mini-personaggi che raggiungono il proprio spicchio; il passaggio ad Accedi/Registrati avviene con camera push sulla fetta scelta. | Riutilizzare `pizza-map/*`; produrre 5 cutout personaggio/badge in posa idle. |
| SCN-02 | **Backstage: forma la squadra** | Sostituire il form piatto con un banco di preparazione: scaffali con i 5 badge, impasto al centro, due “sgabelli” per i membri. Il personaggio dell’utente entra quando compila il nome; il secondo compare come sagoma tratteggiata. | 1 fondale backstage, 5 badge/scaffali, 2 spot personaggio, 5 pose solo, 1 slot compagno vuoto, 1 effetto impasto/luce. |
| SCN-03 | **La piazza del giro** | La mappa attuale diventa un mondo vivo: fumo dai comignoli, lanterne, bandierine, palloncini o bici in movimento. Il pin selezionato fa suonare/illuminare la pizzeria e il personaggio della squadra compare vicino all’ingresso. | Separare la piazza in 4–6 layer o mantenere la base attuale con overlay; produrre smoke, light, bunting, 5 mini-pair cutout e 5 animazioni di idle. |
| SCN-04 | **La facciata della pizzeria** | Potenziare l’ingresso già presente. La coppia saluta, il cartello si aggiorna, le porte reagiscono al passaggio del mouse/tap e la camera entra nella soglia. | Riutilizzare `pizzeria-entrance/scenes/*`, `characters/*`, porte e common FX. Aggiungere per ogni team: posa saluto, posa attesa, props locali e 2–3 micro-loop. |
| SCN-05 | **La tavolata della serata** | Il dettaglio diventa un piano tavola in parallasse: candela, fumo della pizza, bicchieri, tovagliolo e polaroid reagiscono agli hotspot. I due personaggi della coppia siedono/si affacciano ai bordi della scena. | Riutilizzare `tavolo-serata/*`; produrre 5 pair seated/leaning, 5 pose tasting, steam, candle flicker, hand/prop overlays. |
| SCN-06 | **Il calendario delle tappe** | Trasformare la vista Tappe in un calendario da parete/tovaglia: ogni appuntamento è una tessera illustrata con spillo, data e badge. La ruota “Chi tocca dopo?” diventa un piatto girevole o una pizza roulette. | 1 fondale calendario, 3 tipi di card, spilli, timbri stato prenotazione, 1 piatto roulette, 5 micro-illustrazioni squadra. |
| SCN-07 | **La scheda del verdetto** | La scena clipboard è già il riferimento qualitativo. Aggiungere reazioni del personaggio durante lo slider, particelle al completamento di ogni categoria, timbro più fisico e busta che vola verso la classifica. | Riutilizzare `vote-kit/*`; aggiungere 5 set di reazioni, 5 set di inchiostri/segni, 1 transizione busta→classifica. |
| SCN-08 | **Il taccuino / storico** | Lo storico diventa un album di polaroid e pagine annotate: ogni voto salvato appare come ricordo della serata, con coppia, pizza e nota. | Riutilizzare polaroid, paper e clip; produrre 5 cornici team, 5 pose ricordo, sticker “sigillato”, graffi/annotazioni comuni. |
| SCN-09 | **La classifica / gran finale** | La classifica provvisoria vive su un podio da tavola. A sfida conclusa, tutte le coppie entrano nella stessa scena; la vincitrice riceve la fetta/trofeo e parte una celebrazione breve. | Fondale finale, podio, trofeo/fetta vincitrice, 5 pair pose, 1 composizione all-together, confetti, nastri e luce finale. |
| SCN-10 | **La squadra** | La gestione squadra diventa una foto di coppia sul frigo/lavagna della pizzeria: codice invito come ticket staccabile, compagno mancante come spazio vuoto. | 1 fondale fridge/noticeboard, 5 pair portraits, ticket codice, sticker “tu”, sticker “in attesa”. |
| SCN-11 | **Login / registrazione** | Usare l’attuale login come “retro del forno”: il form compare su un biglietto da cucina o su una finestra illuminata. Il passaggio dalla mappa deve sembrare entrare nel locale, non cambiare pagina. | Riutilizzare `login-ticket.webp`; produrre fondale back-of-house, ticket fronte/retro, luce finestra e 2 micro-loop di personaggi. |

## Sistema personaggi

Questa è la parte che darà davvero l’effetto “gioco”. Per ogni squadra servono:

### Pacchetto minimo consigliato

- 2 personaggi singoli per squadra: 10 cutout totali;
- 1 coppia hero per squadra: 5 cutout totali, in posa diversa dalla facciata attuale;
- 3 reazioni per squadra: assaggio, sorpresa/giudizio, esultanza — 15 cutout totali;
- 1 composizione corale con tutte le coppie per il finale;
- 1 silhouette neutra per il compagno non ancora entrato;
- 6–8 effetti comuni: vapore, scintille, luccichio, polvere di farina, confetti, bagliore, fumetto/onomatopea, ombra morbida.

### Specifica asset

- sfondo trasparente, WebP per runtime e master PNG/PSD conservato;
- altezza master consigliata 1400–1800 px, con baseline coerente;
- inquadratura 3/4 frontale, piedi/ombra separati dal corpo quando possibile;
- niente testo incorporato nelle illustrazioni;
- naming: `team__character__pose.webp`, per esempio `pomodoro__solo__tasting.webp`;
- per i loop semplici usare cutout + CSS transform; riservare sprite sheet o frame multipli solo a fumo, fuoco, confetti e gesti importanti.

## Transizioni

| Da → a | Transizione |
|---|---|
| Forno → pizza-mappa | Il forno si avvicina, il bagliore riempie lo schermo e si ricompone nel piatto a cinque spicchi. |
| Pizza-mappa → login | La fetta/badge selezionata cresce e diventa il ticket d’accesso. |
| Login → setup squadra | Il ticket scivola sul banco backstage; compare il primo personaggio. |
| Setup → piazza | Il badge scelto viene lanciato sulla mappa e “accende” la relativa pizzeria. |
| Piazza → facciata | Camera push sul pin, con il badge che diventa l’insegna della pizzeria. |
| Facciata → tavolata | Porte che si aprono, zoom nella soglia, match-cut su tavolo e pizza. |
| Tavolata → voto | La pizza si solleva e ruota nel piatto di transizione già presente, poi atterra sulla clipboard. |
| Voto → piazza/classifica | La busta si chiude, il sigillo parte verso il contatore dei verdetti e aggiorna il podio. |
| Tappe → dettaglio | La tessera calendario viene “presa” dalla scena e diventa il menu della tavolata. |
| Qualsiasi vista → indietro | Camera pull-back breve, ripristino dello stato precedente e nessun reset dei dati. |

Durate consigliate: micro-interazioni 180–240 ms, cambio sezione 450–700 ms, ingresso scena 850–1100 ms, sigillo/finale 1800–3000 ms. Sempre prevedere `prefers-reduced-motion`.

## Impostazione tecnica

1. Mantenere invariati `GuestScene`, `AppView`, callback, API e dati.
2. Introdurre un `SceneShell` comune con `sceneFrom`, `sceneTo`, durata e tipo di transizione.
3. Introdurre un `CharacterActor` data-driven: squadra, posa, posizione, profondità, delay e azione.
4. Spostare la configurazione artistica per team in un manifest unico, vicino a `TEAM_BADGES`.
5. Tenere il rendering in DOM/CSS con layer assoluti, `transform` e `opacity`; non serve un motore canvas per questa fase.
6. Precaricare solo la scena successiva e caricare lazy gli asset delle altre squadre.
7. Garantire che hotspot, form, pulsanti, dialog e slider restino accessibili da tastiera e con screen reader.

## Backlog operativo

Gli item sono ordinati per dipendenza, non solo per impatto visivo. Un incremento può comprendere più item della stessa riga, ma non deve saltare i prerequisiti tecnici della riga precedente.

| ID | Epic | Item di sviluppo | Priorità | Stato | Dipendenze | Criterio di completamento |
|---|---|---|---|---|---|---|
| UX-01 | Foundation | Introdurre `SceneShell` con scena, HUD, transizione e gestione reduced-motion | P0 | ✅ Completato | — | Tutte le viste possono dichiarare scena sorgente/destinazione senza duplicare la logica di animazione. |
| UX-02 | Foundation | Definire HUD di gioco: percorso, ritorno, stato sfida e feedback azioni | P0 | ✅ Completato | UX-01 | La navigazione non dipende più da una barra dashboard a card e resta utilizzabile su mobile. |
| UX-03 | Foundation | Stabilire layout full-scene responsive e regole di profondità/parallasse | P0 | ✅ Completato | UX-01 | La scena occupa il viewport; i pannelli diventano oggetti diegetici o overlay motivati. |
| UX-04 | Foundation | Collegare transizioni narrative tra scene e browser history | P0 | ✅ Completato | UX-01, UX-02 | Ogni passaggio principale ha entrata/uscita coerente e mantiene lo stato precedente. |
| SYS-01 | Personaggi | Consolidare manifest unico team → asset → pose → posizione → azione | P0 | ✅ Completato | — | Nessun componente decide manualmente il file di un personaggio; i team sono configurati in un solo punto. |
| SYS-02 | Personaggi | Completare pacchetto pose: solo, coppia hero, tasting, sorpresa, esultanza e silhouette compagno | P1 | ✅ Completato | SYS-01 | Le pose rispettano baseline, scala, trasparenza e naming definiti nell’art bible. |
| SCN-02 | Core loop | Portare il backstage a scena completa, con form incorporato nel banco e hotspot sui personaggi | P0 | ✅ Completato | UX-01, SYS-01 | Selezione personaggio, nome e invito avvengono nella stessa scena senza pannello form dominante. |
| SCN-03 | Core loop | Trasformare la piazza in hub esplorabile con pizzerie, personaggi e micro-loop ambientali | P0 | ✅ Completato | UX-01, SYS-01 | Tutte le cinque coppie sono visibili, gli ingressi sono riconoscibili e le pizzerie occupate sono apribili. |
| SCN-04 | Core loop | Unificare facciata e ingresso in una transizione camera → porta → interno | P1 | ✅ Completato | UX-04, SCN-03 | L’apertura della pizzeria sembra un attraversamento della soglia e non un cambio pagina. |
| SCN-05 | Core loop | Rendere la tavolata il centro operativo della serata con hotspot diegetici | P1 | ✅ Completato | SCN-04, SYS-02 | Menu, voto e storico si aprono da oggetti della scena, senza griglia di card. |
| SCN-06 | Momento gioco | Sostituire la vista Tappe con calendario/roulette illustrato | P1 | ✅ Completato | UX-01, UX-03 | Ogni tappa è una tessera/oggetto in-world; data, prenotazione e accesso restano invariati. |
| SCN-07 | Momento gioco | Portare la scheda voto dentro la scena clipboard e completare le reazioni dei personaggi | P1 | ✅ Completato | SCN-05, SYS-02 | Slider, note, sigillo e invio mantengono la semantica attuale ma reagiscono visivamente. |
| SCN-08 | Momento gioco | Trasformare lo storico in album di polaroid e pagine annotate | P2 | ✅ Completato | UX-03, SYS-02 | I voti salvati sono esplorabili come ricordi, senza perdere filtri e informazioni attuali. |
| SCN-09 | Finale | Creare podio e scena corale per classifica/finale | P1 | ✅ Completato | SYS-02, UX-04 | Le cinque coppie possono stare nella stessa composizione e la vincitrice ha una celebrazione dedicata. |
| SCN-10 | Squadra | Trasformare Gestisci squadra in foto/frigo/lavagna con ticket invito | P2 | ✅ Completato | UX-03, SYS-02 | Codice, membri e stato compagno sono oggetti della scena, non campi in un pannello isolato. |
| SCN-11 | Accesso | Integrare login/registrazione nel retro del forno con transizione dalla mappa | P2 | ✅ Completato | UX-04 | L’accesso mantiene validazioni e messaggi, ma visivamente appartiene allo stesso mondo. |
| QA-01 | Qualità | Audit visivo desktop/mobile per ogni scena e transizione | P0 | ✅ Completato | Ogni incremento | Screenshot archiviati, nessun elemento volante, proporzioni coerenti e nessun overflow critico. |
| QA-02 | Qualità | Test funzionale completo avanti/indietro, dati vuoti/parziali e reduced-motion | P0 | ✅ Completato | UX-04, SCN-02…SCN-11 | Il flusso originale è invariato e tutte le scene degradano correttamente con dati incompleti. |
| POL-01 | Polish | Ottimizzare asset runtime e verificare breakpoint intermedi/testi lunghi | P1 | ✅ Completato | QA-01, QA-02 | Le pose runtime sono compresse senza perdita visiva evidente e i breakpoint intermedi non generano overflow critico. |

### Definition of Done per ogni incremento

- requisito funzionale verificato nel flusso reale;
- scena osservata in browser con screenshot desktop/mobile;
- asset nuovi salvati nel manifest e nella directory corretta;
- interazioni tastiera, focus, `aria-label` e reduced-motion verificati;
- `npm test` e `npm run build` completati;
- stato e note aggiornati in questo backlog.

## Roadmap consigliata

### Fase 1 — Art bible e sistema di movimento

Palette team, regole di luce/ombra, scala personaggi, naming asset, `SceneShell`, `CharacterActor`, transizioni globali e comportamento reduced-motion.

### Fase 2 — Core game loop

Forno → mappa → setup → piazza → facciata → tavolata. Qui si percepisce il salto di qualità anche prima di votare.

### Fase 3 — Momento del gioco

Calendario, dettaglio tavolata, scheda voto, sigillo, storico e reazioni dei personaggi.

### Fase 4 — Meta-game e finale

Classifica provvisoria, podio finale, scena corale e celebrazione della vincitrice.

### Fase 5 — Polish

Responsive mobile, performance immagini, focus/keyboard, reduced-motion, test con dati vuoti/parziali e verifica dei passaggi avanti/indietro.

## Prossimo incremento consigliato

Con `POL-01` completato, il prossimo passo è il **release sign-off**: smoke test sull’anteprima di produzione, controllo finale dei percorsi autenticati e decisione su eventuale rimozione dei PNG master dalla directory pubblica dopo averli archiviati separatamente.

1. eseguire uno smoke test sull’ambiente di preview/produzione;
2. verificare cache e `Content-Type: image/webp` degli asset runtime;
3. mantenere i PNG come master finché non è confermata la strategia di distribuzione degli asset;
4. chiudere il backlog grafico e passare a eventuali nuove funzionalità di gioco.
