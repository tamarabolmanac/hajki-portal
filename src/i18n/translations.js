// Flat key dictionaries for the lightweight i18n. Add keys here as screens are
// migrated; missing keys fall back to Serbian, then to the key itself.
export const translations = {
  sr: {
    'lang.label': 'Jezik',

    // web navbar
    'nav.explore': 'Istraži',
    'nav.info': 'Info',
    'nav.account': 'Nalog',
    'nav.login': 'Prijavi se',
    'nav.newRoute': 'Nova ruta',
    'nav.routes': 'Rute',
    'nav.nature': 'Priroda Srbije',
    'nav.quiz': 'Prirodnjački kviz',
    'nav.contact': 'Kontakt',
    'nav.profile': 'Profil',
    'nav.logout': 'Odjavi se',
    'nav.searchRoutes': 'Pretraži rute',
    'nav.quizFriend': 'Kviz sa prijateljem',
    'nav.myProfile': 'Moj profil',
    'nav.signin': 'Prijava',
    'nav.signup': 'Registracija',
    'nav.recTitle': 'Prekid snimanja rute', 'nav.recMsg': 'Da li zaista želite da prekinete snimanje rute?',
    'nav.recYes': 'Da, prekini', 'nav.recNo': 'Nastavi snimanje',

    // bottom nav (mobile)
    'bottomnav.home': 'Početna',
    'bottomnav.explore': 'Istraži',
    'bottomnav.add': 'Dodaj',
    'bottomnav.account': 'Nalog',

    // home / landing
    'home.badge': 'Dobrodošli',
    'home.h1_1': 'Vreme je za',
    'home.h1_2': 'HAJKi',
    'home.lead': 'Podeli svoje avanture, pronađi mesta prema svojim željama, poveži se sa zajednicom.',
    'home.cta_explore': 'Počni da istražuješ',
    'home.feat_gps_t': 'GPS Praćenje',
    'home.feat_gps_d': 'Snimaj svaku rutu u realnom vremenu sa preciznim GPS podacima.',
    'home.feat_comm_t': 'Zajednica',
    'home.feat_comm_d': 'Podeli svoje rute i avanture sa hiljadama planinara iz Srbije.',
    'home.feat_tune_t': 'Rute po meri',
    'home.feat_tune_d': 'Pronađi staze prema svojim kriterijumima i interesovanjima — težini, karakteristikama mesta i lokaciji.',
    'home.kicker': 'Otkrijte Srbiju',
    'home.recent': 'Poslednje zabeležene rute',
    'home.all_routes': 'Sve rute →',
    'home.cta_t1': 'Spremi se za',
    'home.cta_t2': 'avanturu',
    'home.cta_sub': 'Pridruži se zajednici planinara i počni da beležiš svoja istraživanja.',
    'home.cta_register': 'Registruj se besplatno',
    'home.footer': '© 2026 Hajki · Srbija',

    // common + difficulty + tags
    'common.unknown': 'Nepoznat',
    'diff.all': 'Sve', 'diff.easy': 'Lako', 'diff.medium': 'Srednje', 'diff.hard': 'Teško',
    'tag.kafic': 'Kafić', 'tag.komarci': 'Komarci', 'tag.guzva': 'Gužva', 'tag.vodopad': 'Vodopad',
    'tag.reka': 'Reka', 'tag.jezero': 'Jezero', 'tag.vidikovac': 'Vidikovac', 'tag.odmor': 'Mesta za sedenje',
    'tag.suma': 'Šuma', 'tag.dostupno': 'Lako dostupno', 'tag.vetrovito': 'Vetrovito', 'tag.parking': 'Parking',
    'tag.hrana': 'Hrana', 'tag.blato': 'Blato', 'tag.insekti': 'Insekti',

    // explore
    'ex.heroTitle': 'Pretraži rute',
    'ex.searchPh': 'Pretraži rute po nazivu ili opisu...', 'ex.add': '+ Dodaj rutu', 'ex.login': 'Uloguj se',
    'ex.filters': 'Filteri', 'ex.difficulty': 'Težina', 'ex.characteristics': 'Karakteristike mesta',
    'ex.radius': 'Radijus pretrage', 'ex.searching': '📍 Tražim lokaciju...', 'ex.locFound': '✓ Lokacija pronađena',
    'ex.myRoutes': 'Samo moje rute', 'ex.following': 'Samo rute korisnika koje pratim',
    'ex.resetAll': '× Resetuj sve filtere', 'ex.count_one': 'ruta', 'ex.count_many': 'rute',
    'ex.emptyFilter': 'Nema ruta za ovaj filter', 'ex.empty': 'Nema dostupnih ruta',
    'ex.loadMore': 'Učitaj još ruta', 'ex.loadingMore': 'Učitavanje...',
    'ex.loginBookmark': 'Uloguj se da bi sačuvala rute.', 'ex.loginLike': 'Uloguj se da bi lajkovala rute.',
    'ex.locUnsupported': 'Geolokacija nije podržana.', 'ex.locDenied': 'Pristup lokaciji odbijen.',
    'ex.loadingTitle': 'Učitavanje ruta', 'ex.loadingSub': 'Pripremamo vašu avanturu...',

    // route detail
    'rd.back': '← Nazad', 'rd.startNav': '▶ Pokreni navigaciju', 'rd.save': 'Sačuvaj', 'rd.saved': 'Sačuvano',
    'rd.edit': 'Uredi', 'rd.report': 'Prijavi', 'rd.record': '🔴 Snimi rutu', 'rd.delete': '🗑 Obriši',
    'rd.author': 'Autor', 'rd.hiker': 'Planinar', 'rd.duration': 'Trajanje', 'rd.distance': 'Dužina',
    'rd.elevation': 'Visinska razlika', 'rd.about': 'O ruti', 'rd.gallery': 'Galerija',
    'rd.features': 'Karakteristike mesta', 'rd.map': 'Mapa', 'rd.loadingMap': 'Učitavanje mape...',
    'rd.error': 'Greška', 'rd.loadingDetail': 'Učitavanje detalja rute...', 'rd.deleteTitle': 'Obriši rutu',
    'rd.deleteMsg': 'Ova akcija je trajna i ne može se poništiti.', 'rd.deleting': 'Brisanje…',
    'rd.confirmDelete': 'Obriši', 'rd.cancel': 'Otkaži', 'rd.startErr': 'Nije moguće pokrenuti snimanje rute.',

    // map / elevation
    'map.terrain': '⛰ Teren', 'map.flat': '🗺 Mapa', 'map.satellite': '🛰 Satelit', 'map.recenter': 'Centriraj', 'map.recenterTitle': 'Centriraj rutu',
    'ele.ascent': 'uspon', 'ele.descent': 'spust', 'ele.max': 'max',
    'ele.unavailable': 'Profil nadmorske visine nije dostupan za ovu rutu.',

    // add / edit form
    'form.newTitle': 'Dodaj novu rutu', 'form.editTitle': 'Izmeni rutu', 'form.name': 'Naziv', 'form.namePh': 'Naziv rute',
    'form.desc': 'Opis', 'form.descPh': 'Opišite rutu...', 'form.duration': 'Trajanje', 'form.hours': 'časova',
    'form.minutes': 'minuta', 'form.total': 'Ukupno', 'form.difficulty': 'Težina', 'form.diffPick': 'Izaberi težinu',
    'form.diffEasy': 'Laka', 'form.diffModerate': 'Srednja', 'form.diffHard': 'Teška', 'form.diffExpert': 'Napredna',
    'form.length': 'Dužina (km)', 'form.lengthPh': 'npr. 5.5', 'form.photos': 'Fotografije',
    'form.addPhotos': 'Dodajte fotografije', 'form.addPhotosHint': 'Kliknite da izaberete slike',
    'form.photosCountOne': 'slika izabrana', 'form.photosCountMany': 'slika izabrano',
    'form.features': 'Karakteristike mesta', 'form.location': 'Lokacija',
    'form.locationPh': 'Pretraži lokaciju (npr. Kopaonik, Tara...)', 'form.searchBtn': 'Traži', 'form.selected': 'Izabrano',
    'form.save': 'Sačuvaj rutu', 'form.saving': 'Čuvanje...',
    'form.validDistance': 'Molimo unesite validnu distancu, veću od 0', 'form.validMinutes': 'Minuti moraju biti između 0 i 59',
    'form.back': '← Nazad', 'form.bestTime': 'Najbolje vreme za posetu', 'form.bestTimePh': 'Proleće, Leto',
    'form.gpsInfo': '📍 Distanca i trajanje se računaju iz GPS tačaka i ne mogu se ručno menjati.',
    'form.routeImages': 'Slike rute', 'form.existingImages': 'Postojeće slike', 'form.newImages': 'Nove slike',
    'form.addNewImages': 'Dodaj nove slike', 'form.saveChanges': 'Sačuvaj izmene', 'form.loadFailed': 'Greška pri učitavanju rute',

    // choose creation type
    'choose.kicker': 'Nova ruta', 'choose.title': 'Kreiranje nove rute', 'choose.recordTitle': 'Snimi putanju',
    'choose.recordDesc': 'Uključite GPS praćenje i idite na planinarenje. Aplikacija će automatski snimiti vašu putanju.',
    'choose.manualTitle': 'Kreiraj rutu bez snimanja putanje',
    'choose.manualDesc': 'Unesite informacije o ruti ručno — naziv, opis, lokaciju i fotografije.',
    'choose.gpxTitle': 'Uvezi GPX rutu',
    'choose.gpxDesc': 'Otpremi .gpx fajl — distanca, trajanje i nadmorske visine se računaju automatski.',

    // import gpx
    'gpx.title': 'Uvezi GPX rutu', 'gpx.file': 'GPX fajl', 'gpx.pick': 'Izaberi .gpx fajl',
    'gpx.pickHint': 'Kliknite da izaberete fajl', 'gpx.titleOpt': 'Naziv (opciono)',
    'gpx.titlePh': 'Ako ostaviš prazno, uzima se iz GPX-a',
    'gpx.autoNote': '📊 Distanca, trajanje i nadmorske visine se računaju automatski.',
    'gpx.import': 'Uvezi rutu', 'gpx.importing': 'Uvoz...', 'gpx.noFile': 'Izaberi GPX fajl.', 'gpx.failed': 'Uvoz nije uspeo.',

    // record screen
    'rec.title': 'Snimanje rute', 'rec.live': 'UŽIVO', 'rec.gpsReady': 'GPS spreman · Čeka na start',
    'rec.time': 'Vreme', 'rec.distance': 'Distanca', 'rec.start': 'Započni snimanje', 'rec.stop': 'Zaustavi snimanje',
    'rec.stopTitle': 'Zaustavi snimanje?', 'rec.stopMsg': 'Ruta će biti sačuvana i moći ćeš da dodaš detalje.',
    'rec.stopConfirm': 'Zaustavi', 'rec.continue': 'Nastavi', 'rec.leaveTitle': 'Snimanje je u toku',
    'rec.leaveMsg': 'Ako napustiš ekran, snimanje rute se prekida. Da li želiš da zaustaviš i sačuvaš rutu?',
    'rec.leaveConfirm': 'Zaustavi i sačuvaj', 'rec.leaveCancel': 'Nastavi snimanje',
    'rec.createErr': 'Nije moguće započeti snimanje rute.',

    // profile
    'pf.greet': 'Dobrodošla', 'pf.title': 'Moj nalog', 'pf.editProfile': 'Uredi profil', 'pf.name': 'Ime',
    'pf.city': 'Grad', 'pf.country': 'Država', 'pf.email': 'Email', 'pf.save': 'Sačuvaj', 'pf.saving': 'Čuvanje...',
    'pf.km': 'km', 'pf.time': 'Vreme', 'pf.routes': 'Ruta', 'pf.myRoutes': 'Moje rute', 'pf.savedRoutes': 'Sačuvane rute',
    'pf.logout': 'Odjavi se', 'pf.dangerTitle': 'Brisanje naloga',
    'pf.dangerText': 'Brisanje naloga je trajno. Svi tvoji podaci, rute i slike biće nepovratno obrisani.',
    'pf.deleteAccount': '🗑 Obriši nalog', 'pf.deleteRouteTitle': 'Obriši rutu',
    'pf.deleteRouteMsg': 'Ova akcija je trajna i ne može se poništiti.', 'pf.deleteAccTitle': 'Obriši nalog',
    'pf.deleteAccMsg': 'Ova akcija je trajna i ne može se poništiti. Biće obrisani svi tvoji podaci, rute i fotografije.',
    'pf.deleteAccCheck': 'Razumem da ovo briše moj nalog zauvek', 'pf.deleteAccBtn': 'Obriši nalog',
    'pf.sending': 'Slanje…', 'pf.privacy': 'Politika privatnosti', 'pf.cancel': 'Otkaži', 'pf.delete': 'Obriši',
    'pf.location': 'Moja lokacija', 'pf.show': 'Prikaži', 'pf.loading': 'Učitavanje...', 'pf.routesLabel': 'ruta',
    'pf.noRoutesMy': 'Još nemaš ruta.', 'pf.addFirst': 'Dodaj prvu →', 'pf.noSaved': 'Još nisi sačuvala rute.',
    'pf.exploreLink': 'Istraži →', 'pf.admin': 'Administracija', 'pf.adminPanel': 'Admin panel →',

    // user profile
    'up.title': 'Profil planinara', 'up.you': '(ti)', 'up.kmWalked': 'km prepešačeno', 'up.timeNature': 'Vreme u prirodi',
    'up.routes': 'Ruta', 'up.follow': 'Prati', 'up.unfollow': 'Otprati', 'up.report': '⚠️ Prijavi', 'up.block': '🚫 Blokiraj',
    'up.routesTitle': 'Rute ovog planinara', 'up.noRoutes': 'Ovaj korisnik još uvek nije podelio nijednu rutu.',
    'up.back': '← Nazad na rute', 'up.notFound': 'Korisnik nije pronađen.', 'up.error': 'Greška', 'up.points': 'tačaka', 'up.profile': 'Profil',

    // auth
    'auth.loginH1': 'Dobrodošli nazad', 'auth.loginSub': 'Prijavite se za nastavak',
    'auth.emailPh': 'Email adresa', 'auth.passwordPh': 'Lozinka', 'auth.showPass': 'Prikaži lozinku',
    'auth.forgot': 'Zaboravili ste lozinku?', 'auth.signingIn': 'Prijavljivanje...', 'auth.signIn': 'Prijavi se',
    'auth.orSignIn': 'ili se prijavite sa', 'auth.noAccount': 'Nemate nalog?', 'auth.register': 'Registrujte se',
    'auth.fillAll': 'Molimo vas da unesete sve podatke.', 'auth.loginErr': 'Greška pri prijavljivanju. Pokušajte ponovo.',
    'auth.notConfirmed': 'Vaš nalog nije potvrđen. Proverite email i kliknite na link za potvrdu.',
    'auth.badCreds': 'Pogrešna email adresa ili lozinka.', 'auth.noUser': 'Korisnik sa ovim email-om ne postoji.',
    'auth.badEmail': 'Neispravan format email-a.', 'auth.notConfirmedShort': 'Vaš nalog nije potvrđen. Proverite email.',
    'auth.unexpected': 'Došlo je do neočekivane greške. Pokušajte ponovo.',

    // register
    'reg.title': 'Registracija', 'reg.submitting': 'Registracija...', 'reg.submit': 'Registruj se',
    'reg.haveAccount': 'Već imaš nalog?', 'reg.login': 'Uloguj se',
    'reg.name': 'Ime', 'reg.namePh': 'Unesi svoje ime', 'reg.email': 'Email', 'reg.emailPh': 'Unesi svoj email',
    'reg.password': 'Lozinka', 'reg.passwordPh': 'Unesi lozinku', 'reg.confirm': 'Potvrda lozinke', 'reg.confirmPh': 'Potvrdi lozinku',
    'reg.city': 'Grad', 'reg.cityPh': 'Unesi grad', 'reg.country': 'Država', 'reg.countryPh': 'Unesi državu',
    'reg.errName': 'Ime je obavezno', 'reg.errEmail': 'Email je obavezan', 'reg.errEmailFmt': 'Neispravan email format',
    'reg.errPass': 'Lozinka je obavezna', 'reg.errPassLen': 'Lozinka mora da sadrži najmanje 8 karaktera',
    'reg.errConfirm': 'Potvrda lozinke je obavezna', 'reg.errMismatch': 'Lozinke se ne poklapaju',
    'reg.errCity': 'Grad je obavezan', 'reg.errCountry': 'Država je obavezna',
    'reg.success': 'Registracija je uspešna! Proverite email i kliknite na link za potvrdu da aktivirate nalog.',
    'reg.emailTaken': 'Email je već zauzet', 'reg.failed': 'Registracija neuspešna',

    // forgot / reset password
    'fp.title': 'Zaboravljena lozinka', 'fp.sub': 'Unesite email i poslaćemo vam link za reset lozinke.',
    'fp.emailPh': 'Email adresa', 'fp.send': 'Pošalji link', 'fp.sending': 'Slanje...',
    'fp.sent': 'Link za resetovanje lozinke je poslat na vaš email.', 'fp.back': '← Nazad na prijavu', 'fp.error': 'Greška pri slanju zahteva.',
    'rp.title': 'Nova lozinka', 'rp.sub': 'Unesite novu lozinku za vaš nalog.', 'rp.passwordPh': 'Nova lozinka',
    'rp.confirmPh': 'Potvrdi novu lozinku', 'rp.save': 'Sačuvaj lozinku', 'rp.saving': 'Čuvanje...',
    'rp.mismatch': 'Lozinke se ne poklapaju.', 'rp.tooShort': 'Lozinka mora da sadrži najmanje 6 karaktera.',
    'rp.success': 'Lozinka je uspešno promenjena! Preusmeravamo vas na stranicu za prijavu...', 'rp.invalid': 'Nevalidan token za resetovanje lozinke.',
    'rp.checking': 'Proveravanje tokena...', 'rp.error': 'Greška pri resetovanju lozinke.',

    // report / block (native prompts)
    'report.routePrompt': 'Prijavi rutu. Razlog:\n1 - Spam\n2 - Neprikladan sadržaj\n3 - Uznemiravanje\n4 - Netačne informacije\n5 - Ostalo\n\nUnesi broj (1-5):',
    'report.userPrompt': 'Prijavi ovog korisnika. Razlog:\n1 - Spam\n2 - Neprikladan sadržaj\n3 - Uznemiravanje\n4 - Ostalo\n\nUnesi broj (1-4):',
    'report.invalid': 'Nevažeći izbor.', 'report.details': 'Dodatni opis (opciono):',
    'report.sent': 'Prijava je poslata. Hvala što pomažeš da zajednica bude bezbedna.', 'report.errorPrefix': 'Greška: ',
    'block.confirm': 'Blokiraj ovog korisnika? Nećeš više videti njegove rute, niti će vas dvoje moći da se pratite.',
    'block.done': 'Korisnik je blokiran.',

    // contact
    'contact.badge': 'Kontakt', 'contact.title': 'Povežite se sa nama',
    'contact.lead': 'Želite da podelite svoje iskustvo ili predlog? Kontaktirajte nas - tu smo da vam pomognemo u vašoj sledećoj avanturi.',
    'contact.text': 'Naš tim je uvek spreman da odgovori na vaša pitanja o pešačkim rutama, biciklističkim stazama ili bilo čemu što se tiče aktivnog provođenja vremena u prirodi.',
    'contact.emailLabel': 'Pošaljite nam email na:', 'contact.phoneLabel': 'Pozovite nas:',

    // splash
    'splash.tag': 'Istraži · Prati · Deli',

    // loader
    'loader.default': 'Učitavanje...',
  },
  en: {
    'lang.label': 'Language',

    // web navbar
    'nav.explore': 'Explore',
    'nav.info': 'Info',
    'nav.account': 'Account',
    'nav.login': 'Log in',
    'nav.newRoute': 'New route',
    'nav.routes': 'Routes',
    'nav.nature': 'Nature of Serbia',
    'nav.quiz': 'Nature quiz',
    'nav.contact': 'Contact',
    'nav.profile': 'Profile',
    'nav.logout': 'Log out',
    'nav.searchRoutes': 'Search routes',
    'nav.quizFriend': 'Quiz with a friend',
    'nav.myProfile': 'My profile',
    'nav.signin': 'Sign in',
    'nav.signup': 'Sign up',
    'nav.recTitle': 'Stop route recording', 'nav.recMsg': 'Do you really want to stop recording the route?',
    'nav.recYes': 'Yes, stop', 'nav.recNo': 'Keep recording',

    // bottom nav (mobile)
    'bottomnav.home': 'Home',
    'bottomnav.explore': 'Explore',
    'bottomnav.add': 'Add',
    'bottomnav.account': 'Account',

    // home / landing
    'home.badge': 'Welcome',
    'home.h1_1': 'Time for',
    'home.h1_2': 'HAJKi',
    'home.lead': 'Share your adventures, find places that match your wishes, connect with the community.',
    'home.cta_explore': 'Start exploring',
    'home.feat_gps_t': 'GPS Tracking',
    'home.feat_gps_d': 'Record every route in real time with precise GPS data.',
    'home.feat_comm_t': 'Community',
    'home.feat_comm_d': 'Share your routes and adventures with thousands of hikers from Serbia.',
    'home.feat_tune_t': 'Routes for you',
    'home.feat_tune_d': 'Find trails by your own criteria and interests — difficulty, place features and location.',
    'home.kicker': 'Discover Serbia',
    'home.recent': 'Recently recorded routes',
    'home.all_routes': 'All routes →',
    'home.cta_t1': 'Get ready for',
    'home.cta_t2': 'adventure',
    'home.cta_sub': 'Join the hiking community and start logging your explorations.',
    'home.cta_register': 'Sign up for free',
    'home.footer': '© 2026 Hajki · Serbia',

    // common + difficulty + tags
    'common.unknown': 'Unknown',
    'diff.all': 'All', 'diff.easy': 'Easy', 'diff.medium': 'Moderate', 'diff.hard': 'Hard',
    'tag.kafic': 'Coffee spot', 'tag.komarci': 'Mosquitoes', 'tag.guzva': 'Crowded', 'tag.vodopad': 'Waterfall',
    'tag.reka': 'River', 'tag.jezero': 'Lake', 'tag.vidikovac': 'Viewpoint', 'tag.odmor': 'Seating',
    'tag.suma': 'Forest', 'tag.dostupno': 'Easy access', 'tag.vetrovito': 'Windy', 'tag.parking': 'Parking',
    'tag.hrana': 'Food', 'tag.blato': 'Mud', 'tag.insekti': 'Insects',

    // explore
    'ex.heroTitle': 'Browse routes',
    'ex.searchPh': 'Search routes by name or description...', 'ex.add': '+ Add route', 'ex.login': 'Log in',
    'ex.filters': 'Filters', 'ex.difficulty': 'Difficulty', 'ex.characteristics': 'Place features',
    'ex.radius': 'Search radius', 'ex.searching': '📍 Finding location...', 'ex.locFound': '✓ Location found',
    'ex.myRoutes': 'Only my routes', 'ex.following': 'Only routes from people I follow',
    'ex.resetAll': '× Reset all filters', 'ex.count_one': 'route', 'ex.count_many': 'routes',
    'ex.emptyFilter': 'No routes for this filter', 'ex.empty': 'No routes available',
    'ex.loadMore': 'Load more routes', 'ex.loadingMore': 'Loading...',
    'ex.loginBookmark': 'Log in to save routes.', 'ex.loginLike': 'Log in to like routes.',
    'ex.locUnsupported': 'Geolocation is not supported.', 'ex.locDenied': 'Location access denied.',
    'ex.loadingTitle': 'Loading routes', 'ex.loadingSub': 'Preparing your adventure...',

    // route detail
    'rd.back': '← Back', 'rd.startNav': '▶ Start navigation', 'rd.save': 'Save', 'rd.saved': 'Saved',
    'rd.edit': 'Edit', 'rd.report': 'Report', 'rd.record': '🔴 Record route', 'rd.delete': '🗑 Delete',
    'rd.author': 'Author', 'rd.hiker': 'Hiker', 'rd.duration': 'Duration', 'rd.distance': 'Distance',
    'rd.elevation': 'Elevation gain', 'rd.about': 'About', 'rd.gallery': 'Gallery',
    'rd.features': 'Place features', 'rd.map': 'Map', 'rd.loadingMap': 'Loading map...',
    'rd.error': 'Error', 'rd.loadingDetail': 'Loading route details...', 'rd.deleteTitle': 'Delete route',
    'rd.deleteMsg': 'This action is permanent and cannot be undone.', 'rd.deleting': 'Deleting…',
    'rd.confirmDelete': 'Delete', 'rd.cancel': 'Cancel', 'rd.startErr': 'Couldn\'t start route recording.',

    // map / elevation
    'map.terrain': '⛰ Terrain', 'map.flat': '🗺 Map', 'map.satellite': '🛰 Satellite', 'map.recenter': 'Recenter', 'map.recenterTitle': 'Recenter route',
    'ele.ascent': 'ascent', 'ele.descent': 'descent', 'ele.max': 'max',
    'ele.unavailable': 'Elevation profile is not available for this route.',

    // add / edit form
    'form.newTitle': 'Add a new route', 'form.editTitle': 'Edit route', 'form.name': 'Name', 'form.namePh': 'Route name',
    'form.desc': 'Description', 'form.descPh': 'Describe the route...', 'form.duration': 'Duration', 'form.hours': 'hours',
    'form.minutes': 'minutes', 'form.total': 'Total', 'form.difficulty': 'Difficulty', 'form.diffPick': 'Select difficulty',
    'form.diffEasy': 'Easy', 'form.diffModerate': 'Moderate', 'form.diffHard': 'Hard', 'form.diffExpert': 'Expert',
    'form.length': 'Distance (km)', 'form.lengthPh': 'e.g. 5.5', 'form.photos': 'Photos',
    'form.addPhotos': 'Add photos', 'form.addPhotosHint': 'Click to choose images',
    'form.photosCountOne': 'image selected', 'form.photosCountMany': 'images selected',
    'form.features': 'Place features', 'form.location': 'Location',
    'form.locationPh': 'Search a location (e.g. Kopaonik, Tara...)', 'form.searchBtn': 'Search', 'form.selected': 'Selected',
    'form.save': 'Save route', 'form.saving': 'Saving...',
    'form.validDistance': 'Please enter a valid distance, greater than 0', 'form.validMinutes': 'Minutes must be between 0 and 59',
    'form.back': '← Back', 'form.bestTime': 'Best time to visit', 'form.bestTimePh': 'Spring, Summer',
    'form.gpsInfo': '📍 Distance and duration are computed from GPS points and can\'t be edited manually.',
    'form.routeImages': 'Route images', 'form.existingImages': 'Existing images', 'form.newImages': 'New images',
    'form.addNewImages': 'Add new images', 'form.saveChanges': 'Save changes', 'form.loadFailed': 'Failed to load route',

    // choose creation type
    'choose.kicker': 'New route', 'choose.title': 'Create a new route', 'choose.recordTitle': 'Record a track',
    'choose.recordDesc': 'Turn on GPS tracking and go hiking. The app records your track automatically.',
    'choose.manualTitle': 'Create a route without tracking',
    'choose.manualDesc': 'Enter the route details manually — name, description, location and photos.',
    'choose.gpxTitle': 'Import a GPX route',
    'choose.gpxDesc': 'Upload a .gpx file — distance, duration and elevation are computed automatically.',

    // import gpx
    'gpx.title': 'Import GPX route', 'gpx.file': 'GPX file', 'gpx.pick': 'Choose a .gpx file',
    'gpx.pickHint': 'Click to choose a file', 'gpx.titleOpt': 'Name (optional)',
    'gpx.titlePh': 'If left empty, taken from the GPX',
    'gpx.autoNote': '📊 Distance, duration and elevation are computed automatically.',
    'gpx.import': 'Import route', 'gpx.importing': 'Importing...', 'gpx.noFile': 'Choose a GPX file.', 'gpx.failed': 'Import failed.',

    // record screen
    'rec.title': 'Recording route', 'rec.live': 'LIVE', 'rec.gpsReady': 'GPS ready · Waiting to start',
    'rec.time': 'Time', 'rec.distance': 'Distance', 'rec.start': 'Start recording', 'rec.stop': 'Stop recording',
    'rec.stopTitle': 'Stop recording?', 'rec.stopMsg': 'The route will be saved and you can add details.',
    'rec.stopConfirm': 'Stop', 'rec.continue': 'Continue', 'rec.leaveTitle': 'Recording in progress',
    'rec.leaveMsg': 'If you leave this screen, recording stops. Do you want to stop and save the route?',
    'rec.leaveConfirm': 'Stop and save', 'rec.leaveCancel': 'Keep recording',
    'rec.createErr': 'Couldn\'t start recording.',

    // profile
    'pf.greet': 'Welcome', 'pf.title': 'My account', 'pf.editProfile': 'Edit profile', 'pf.name': 'Name',
    'pf.city': 'City', 'pf.country': 'Country', 'pf.email': 'Email', 'pf.save': 'Save', 'pf.saving': 'Saving...',
    'pf.km': 'km', 'pf.time': 'Time', 'pf.routes': 'Routes', 'pf.myRoutes': 'My routes', 'pf.savedRoutes': 'Saved routes',
    'pf.logout': 'Log out', 'pf.dangerTitle': 'Delete account',
    'pf.dangerText': 'Deleting your account is permanent. All your data, routes and photos will be irreversibly deleted.',
    'pf.deleteAccount': '🗑 Delete account', 'pf.deleteRouteTitle': 'Delete route',
    'pf.deleteRouteMsg': 'This action is permanent and cannot be undone.', 'pf.deleteAccTitle': 'Delete account',
    'pf.deleteAccMsg': 'This action is permanent and cannot be undone. All your data, routes and photos will be deleted.',
    'pf.deleteAccCheck': 'I understand this deletes my account forever', 'pf.deleteAccBtn': 'Delete account',
    'pf.sending': 'Sending…', 'pf.privacy': 'Privacy policy', 'pf.cancel': 'Cancel', 'pf.delete': 'Delete',
    'pf.location': 'My location', 'pf.show': 'Show', 'pf.loading': 'Loading...', 'pf.routesLabel': 'routes',
    'pf.noRoutesMy': "You don't have any routes yet.", 'pf.addFirst': 'Add your first →', 'pf.noSaved': "You haven't saved any routes yet.",
    'pf.exploreLink': 'Explore →', 'pf.admin': 'Administration', 'pf.adminPanel': 'Admin panel →',

    // user profile
    'up.title': 'Hiker profile', 'up.you': '(you)', 'up.kmWalked': 'km walked', 'up.timeNature': 'Time in nature',
    'up.routes': 'Routes', 'up.follow': 'Follow', 'up.unfollow': 'Unfollow', 'up.report': '⚠️ Report', 'up.block': '🚫 Block',
    'up.routesTitle': "This hiker's routes", 'up.noRoutes': "This user hasn't shared any routes yet.",
    'up.back': '← Back to routes', 'up.notFound': 'User not found.', 'up.error': 'Error', 'up.points': 'pts', 'up.profile': 'Profile',

    // auth
    'auth.loginH1': 'Welcome back', 'auth.loginSub': 'Sign in to continue',
    'auth.emailPh': 'Email address', 'auth.passwordPh': 'Password', 'auth.showPass': 'Show password',
    'auth.forgot': 'Forgot your password?', 'auth.signingIn': 'Signing in...', 'auth.signIn': 'Sign in',
    'auth.orSignIn': 'or sign in with', 'auth.noAccount': "Don't have an account?", 'auth.register': 'Sign up',
    'auth.fillAll': 'Please enter all the details.', 'auth.loginErr': 'Login error. Please try again.',
    'auth.notConfirmed': 'Your account is not confirmed. Check your email and click the confirmation link.',
    'auth.badCreds': 'Wrong email or password.', 'auth.noUser': 'No user exists with this email.',
    'auth.badEmail': 'Invalid email format.', 'auth.notConfirmedShort': 'Your account is not confirmed. Check your email.',
    'auth.unexpected': 'An unexpected error occurred. Please try again.',

    // register
    'reg.title': 'Sign up', 'reg.submitting': 'Signing up...', 'reg.submit': 'Sign up',
    'reg.haveAccount': 'Already have an account?', 'reg.login': 'Log in',
    'reg.name': 'Name', 'reg.namePh': 'Enter your name', 'reg.email': 'Email', 'reg.emailPh': 'Enter your email',
    'reg.password': 'Password', 'reg.passwordPh': 'Enter a password', 'reg.confirm': 'Confirm password', 'reg.confirmPh': 'Confirm your password',
    'reg.city': 'City', 'reg.cityPh': 'Enter your city', 'reg.country': 'Country', 'reg.countryPh': 'Enter your country',
    'reg.errName': 'Name is required', 'reg.errEmail': 'Email is required', 'reg.errEmailFmt': 'Invalid email format',
    'reg.errPass': 'Password is required', 'reg.errPassLen': 'Password must be at least 8 characters',
    'reg.errConfirm': 'Password confirmation is required', 'reg.errMismatch': "Passwords don't match",
    'reg.errCity': 'City is required', 'reg.errCountry': 'Country is required',
    'reg.success': 'Registration successful! Check your email and click the confirmation link to activate your account.',
    'reg.emailTaken': 'Email is already taken', 'reg.failed': 'Registration failed',

    // forgot / reset password
    'fp.title': 'Forgot password', 'fp.sub': 'Enter your email and we will send you a reset link.',
    'fp.emailPh': 'Email address', 'fp.send': 'Send link', 'fp.sending': 'Sending...',
    'fp.sent': 'A password reset link has been sent to your email.', 'fp.back': '← Back to sign in', 'fp.error': 'Error sending the request.',
    'rp.title': 'New password', 'rp.sub': 'Enter a new password for your account.', 'rp.passwordPh': 'New password',
    'rp.confirmPh': 'Confirm new password', 'rp.save': 'Save password', 'rp.saving': 'Saving...',
    'rp.mismatch': "Passwords don't match.", 'rp.tooShort': 'Password must be at least 6 characters.',
    'rp.success': 'Password changed successfully! Redirecting you to the sign-in page...', 'rp.invalid': 'Invalid password reset token.',
    'rp.checking': 'Checking token...', 'rp.error': 'Error resetting the password.',

    // report / block (native prompts)
    'report.routePrompt': 'Report route. Reason:\n1 - Spam\n2 - Inappropriate content\n3 - Harassment\n4 - Inaccurate information\n5 - Other\n\nEnter a number (1-5):',
    'report.userPrompt': 'Report this user. Reason:\n1 - Spam\n2 - Inappropriate content\n3 - Harassment\n4 - Other\n\nEnter a number (1-4):',
    'report.invalid': 'Invalid choice.', 'report.details': 'Additional description (optional):',
    'report.sent': 'Your report has been sent. Thank you for helping keep the community safe.', 'report.errorPrefix': 'Error: ',
    'block.confirm': "Block this user? You won't see their routes anymore, and the two of you won't be able to follow each other.",
    'block.done': 'User has been blocked.',

    // contact
    'contact.badge': 'Contact', 'contact.title': 'Get in touch',
    'contact.lead': 'Want to share your experience or a suggestion? Get in touch - we are here to help with your next adventure.',
    'contact.text': 'Our team is always ready to answer your questions about hiking routes, cycling trails or anything related to spending active time in nature.',
    'contact.emailLabel': 'Email us at:', 'contact.phoneLabel': 'Call us:',

    // splash
    'splash.tag': 'Explore · Track · Share',

    // loader
    'loader.default': 'Loading...',
  },
};
