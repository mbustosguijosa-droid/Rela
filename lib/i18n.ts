// Textos de la web en español e inglés.
// Para añadir un texto: ponlo en `es` y su traducción en `en` con la misma clave.

export type Lang = "es" | "en";
export const LANGS: Lang[] = ["es", "en"];
export const LOCALE: Record<Lang, string> = { es: "es-ES", en: "en-GB" };

const es = {
  meta: { description: "Puntúa tus discos canción a canción, lee lo que opina la gente y comparte tus notas." },
  nav: { home: "Inicio", explore: "Explorar", friends: "Amigos", myProfile: "Mi perfil", profile: "Perfil", search: "Buscar", enter: "Entrar", searchPh: "Álbumes, singles o artistas", searchLabel: "Buscar", homeLabel: "Rela, inicio", main: "Principal", tabs: "Pestañas" },
  footer: { beta: "Rela · versión en pruebas. Catálogo: Deezer.", privacy: "Privacidad", terms: "Términos", language: "Idioma" },
  kind: { album: "Álbum", single: "Single", ep: "EP", compile: "Recopilatorio", disc: "Disco" } as Record<string, string>,
  tier: { under: "Underground", culto: "De culto", conocido: "Conocido", main: "Mainstream" } as Record<string, string>,
  common: {
    coverOf: (t: string) => `Portada de ${t}`, song: "Canción", songs: (n: number) => `${n} ${n === 1 ? "canción" : "canciones"}`,
    min: "min", you: "Tú", friend: "Amigo", seeAll: "Ver todo", translate: "Traducir", translateTitle: "Traducir con Google Traductor",
    fansDeezer: (n: string) => `${n} fans en Deezer`, yourVoteCounts: "Tu nota aquí cuenta mucho.", tracksN: (n: number) => `${n} ${n === 1 ? "canción" : "canciones"}`,
  },
  home: {
    title1: "Puntúa tus discos.", title2: "Canción a canción.",
    intro: "Lleva un diario de lo que escuchas, descubre qué opina la gente y comparte tus notas en stories.",
    createProfile: "Crear mi perfil gratis", fresh: "Novedades · música recién salida", freshError: "No se han podido cargar las novedades. Prueba en un rato.",
    forYou: "Para ti · canciones de tu nicho", forYouCount: (n: number) => `Según los ${n} artistas que sigues`, forYouOff: "Sigue artistas para activarlo",
    because: (n: string) => `Porque sigues a ${n}`, followArtistsTitle: "Sigue a tus artistas favoritos",
    followArtistsText: "Busca un artista y pulsa “Seguir artista”: aquí te recomendaremos canciones de grupos parecidos, sobre todo pequeños.",
    searchArtists: "Buscar artistas", trending: "Reseñas en tendencia", byInteraction: "Ordenadas por interacción",
    noReviews: "Todavía no hay reseñas. Abre un disco, puntúalo y escribe la primera.", friendsNews: "Novedades de tus amigos", manageFriends: "Gestionar amigos",
    friendsNothing: "Tus amigos aún no han puntuado nada.", noFollowing: "Todavía no sigues a nadie.", findFriends: "Busca amigos",
    chart: "Lo más escuchado ahora", chartSub: "Top de Deezer",
  },
  search: {
    title: "Buscar", resultsFor: "Resultados para", anyRecord: "Busca cualquier disco",
    intro: "Todo el catálogo de Deezer: álbumes, singles y EPs, desde lo más escuchado hasta artistas con un puñado de oyentes.",
    artists: "Artistas", records: "Discos", all: "Todo", albums: "Álbumes", singles: "Singles y EPs", none: "No hay resultados. Prueba con otro nombre.",
  },
  album: {
    notFound: "Disco no encontrado", metaDesc: (t: string, a: string) => `Puntúa ${t} de ${a} canción a canción y lee qué opina la gente en Rela.`,
    avgOf: (n: string, one: boolean) => `Media de ${n} ${one ? "nota" : "notas"} en Rela`, nobody: "Nadie lo ha puntuado aún: sé la primera persona",
    reviewsN: (n: number) => `${n} ${n === 1 ? "reseña" : "reseñas"}`, distribution: "Reparto de notas",
    featured: "Reseña destacada", reviewsTitle: "Reseñas y debate", reviewsIntro: "Reacciona y responde: las reseñas con más interacción suben arriba.",
    noReviews: "Todavía no hay reseñas de este disco. La tuya puede ser la primera.", yourFriends: "Tus amigos",
    friendsRated: (a: number, b: number) => `${a} de ${b} lo han puntuado`, noFriendRated: "Ninguna persona que sigues lo ha puntuado todavía.",
  },
  rater: {
    rateTracks: "Puntúa canción a canción", rateTracksSub: "Desliza para poner nota del 1 al 10. Marca tu favorita con la estrella.",
    rateTrack: "Puntúa la canción", rateTrackSub: "Desliza para poner nota del 1 al 10.",
    lyricsOf: (t: string) => `Letra de ${t} en Genius`, lyrics: "Letra en Genius", favOf: (t: string) => `Marcar ${t} como favorita`, scoreOf: (t: string) => `Nota de ${t}`,
    yourScore: "Tu nota", avgOf: (a: number, b: number) => `Media de ${a} de ${b} canciones:`, rateToAvg: "Puntúa las canciones y calculamos la media.",
    useAvg: "Usar la media", final: "Nota final", listened: "Escuchado", liked: "Me gusta", inTop4: "★ En tu top 4", addTop4: "Añadir al top 4",
    inLoop: "↻ En bucle", setLoop: "Lo tengo en bucle", lyricsGenius: "Letras en Genius ↗",
    removedTop4: "Quitado de tu top 4", addedTop4: "Añadido a tu top 4", removedLoop: "Quitado de “en bucle”", addedLoop: "Ahora sale en tu perfil como “en bucle”",
    saving: "Guardando…", saved: "✓ Guardado en tu perfil", saveError: "No se ha podido guardar. Revisa tu conexión.", autosave: "Tu nota se guarda sola en tu perfil.",
    enter: "Entra", enterToSave: "para guardar tu nota en tu perfil y que la vean tus amigos.",
  },
  reviews: {
    sorts: { hot: "Destacadas", new: "Más recientes", top: "Más votadas", debate: "Más polémicas" } as Record<string, string>,
    notes: {
      hot: "Destacadas: me gusta, reacciones y respuestas, con más peso a lo reciente.", new: "Las últimas en publicarse.",
      top: "Las que más interacción acumulan.", debate: "Donde hay más gente a favor y en contra a la vez.",
    } as Record<string, string>,
    reacts: { like: "Me gusta", fuego: "Fuego", acuerdo: "De acuerdo", discrepo: "No estoy de acuerdo" } as Record<string, string>,
    replies: (n: number) => `${n} ${n === 1 ? "respuesta" : "respuestas"}`, debate: "En debate",
    enterToReact: "Entra para reaccionar a las reseñas.", enterToReply: "Entra para responder.", replyTo: (n: string) => `Responde a ${n}…`, thisReview: "esta reseña",
    writeReply: "Escribe una respuesta", reply: "Responder", enter: "Entra", toReply: "para responder.", report: "Denunciar reseña", reported: "Gracias. Revisaremos esta reseña.",
    composerEnter: "para escribir tu reseña y reaccionar a las de los demás.", placeholder: "¿Qué te ha parecido? Saldrá junto a tu nota.", yourReview: "Tu reseña",
    hasReview: "Ya tienes una reseña: puedes editarla o dejarla vacía para borrarla.", climb: "Las reseñas con más interacción suben arriba.",
    publishing: "Publicando…", update: "Actualizar reseña", publish: "Publicar reseña",
    published: "Reseña publicada. Si recibe reacciones, subirá en Destacadas.", deleted: "Reseña borrada.",
  },
  artist: {
    label: "Artista", followersRela: (n: string, one: boolean) => `${n} ${one ? "seguidor" : "seguidores"} en Rela`,
    albumsN: (n: number) => `${n} álbumes`, singlesN: (n: number) => `${n} singles y EPs`, albums: "Álbumes", noAlbums: "Sin álbumes en el catálogo.",
    singles: "Singles y EPs", niche: "Artistas de su nicho", ifYouLike: (n: string) => `Si te gusta ${n}`,
    follow: "+ Seguir artista", following: "✓ Siguiendo", followed: (n: string) => `Sigues a ${n}. Te recomendaremos música de su nicho en el inicio.`, unfollowed: (n: string) => `Has dejado de seguir a ${n}.`,
  },
  follow: { follow: "Seguir", following: "✓ Siguiendo" },
  login: {
    title: "Entrar", heading: "Entra en Rela", intro: "Guarda tus notas, escribe reseñas, sigue a tus amigos y personaliza tu perfil.",
    failed: "No se ha podido iniciar sesión", retry: "Vuelve a intentarlo. Si usaste el email, abre el enlace en este mismo navegador.", tech: "Mensaje técnico:",
    errVerifier: "Abriste el enlace en otro navegador o app. Pide un enlace nuevo y ábrelo en este mismo navegador.",
    errExpired: "El enlace ha caducado o ya se usó. Pide uno nuevo.",
    errProvider: "El acceso con Google no está activado en Supabase (Authentication → Sign In / Providers → Google).",
    errDenied: "Has cancelado el acceso o Google no lo ha permitido (revisa que la app esté publicada o que tu email sea usuario de prueba).",
    notConfigured: "Las cuentas aún no están configuradas: faltan las variables de Supabase en Vercel.",
    googleOff: "El acceso con Google todavía no está activado. Usa tu email mientras tanto.", rate: "Se han enviado demasiados emails. Espera unos minutos y vuelve a probar.",
    google: "Continuar con Google", orEmail: "o con tu email", sent: (e: string) => `Te hemos enviado un enlace a ${e}. Ábrelo en este mismo navegador para entrar. Mira también en spam.`,
    email: "Email", sending: "Enviando…", sendLink: "Enviarme un enlace para entrar", noPasswords: "Sin contraseñas: te llega un enlace y entras. Si es tu primera vez, se crea tu cuenta.",
  },
  profile: {
    notFound: "Perfil no encontrado", metaDesc: (h: string) => `Perfil de @${h} en Rela`, edit: "Editar perfil", inLoop: "En bucle:",
    records: "Discos", avg: "Nota media", reviews: "Reseñas", followers: "Seguidores", following: "Siguiendo",
    compat: "Compatibilidad musical", compatNone: "Puntuad al menos 2 discos en común para calcularla.",
    compatText: (n: number, v: number) => `Habéis puntuado ${n} discos en común. ${v >= 80 ? "Gemelos musicales." : v >= 60 ? "Buen match: os vais a descubrir cosas." : "Gustos muy distintos: ideal para salir de tu burbuja."}`,
    badges: "Insignias", myTop4: "Mi top 4", top4Of: (n: string) => `Top 4 de ${n}`, addFromAlbum: "Añádelos desde la página de cada disco", pickRecord: "+ Elegir disco",
    myArtists: "Artistas que sigo", theirArtists: "Artistas que sigue", myReviews: "Mis reseñas", reviewsOf: (n: string) => `Reseñas de ${n}`, likesReceived: (n: string) => `♥ ${n} recibidos`,
    common: "Discos en común", commonSub: (n: string) => `${n} · tú`, myRecords: "Mis discos", recordsOf: (n: string) => `Discos de ${n}`,
    emptyOwn: "Aún no has puntuado nada.", searchRecord: "Busca un disco", emptyOwn2: "y empieza.", emptyOther: "Todavía no ha puntuado ningún disco.",
    howRates: "Cómo puntúa", size: "Tamaño de lo que escucha",
    badge: {
      under: ["Cazador underground", "Un tercio de sus discos son de artistas con menos de 10.000 fans"], culto: ["Oído de culto", "3 o más discos de artistas de culto"],
      strict: ["Crítico exigente", "Nota media por debajo de 7"], heart: ["Corazón fácil", "Le da me gusta a casi todo"],
      first: ["Primeros pasos", "Ya ha puntuado su primer disco"], meloman: ["Melómano", "Más de 50 discos puntuados"],
    } as Record<string, [string, string]>,
  },
  editProfile: {
    title: "Editar perfil", create: "Crea tu perfil", intro: "Así te verán tus amigos. Ponle tu foto, una cabecera y tu color.",
    welcome: "¡Bienvenida/o a Rela!", welcomeText: "Elige tu nombre de usuario y ponle foto a tu perfil. Lo podrás cambiar cuando quieras.",
    uploading: "Subiendo…", changeBanner: "Cambiar cabecera", remove: "Quitar", uploadPhoto: "Subir foto", removePhoto: "Quitar foto",
    name: "Nombre", namePh: "Cómo quieres que te vean", handle: "Nombre de usuario", handleHint: (h: string) => `Entre 3 y 24 caracteres: letras minúsculas, números, punto o guion bajo. Tu perfil será rela…/u/${h}`,
    bio: "Bio", bioPh: "Discos de cabecera, conciertos, manías…", city: "Ciudad", color: "Color de tu perfil", colorOf: (c: string) => `Color ${c}`,
    signOut: "Cerrar sesión", saving: "Guardando…", save: "Guardar perfil", onlyImages: "Sube una imagen (JPG o PNG).",
    uploadError: (m: string) => `No se ha podido subir la imagen: ${m}. Si dice "Bucket not found", falta ejecutar el archivo 002 en Supabase.`,
  },
  friends: {
    title: "Amigos", intro: "Sigue a gente con buen oído, mira qué escuchan y compara tus notas con las suyas.", notConfigured: "Las cuentas todavía no están configuradas.",
    searchPeople: "Buscar personas", searchPh: "Nombre, @usuario o ciudad", search: "Buscar", results: "Resultados", noMatch: (q: string) => `Nadie coincide con “${q}”. Invítale con tu enlace.`,
    following: "Siguiendo", noFollowing: "Todavía no sigues a nadie. Busca a tus amigos o mira las sugerencias.", enter: "Entra",
    enterToFollow: "para seguir a tus amigos y ver sus notas en tu inicio.", newPeople: "Gente nueva en Rela", fewPeople: "Aún hay poca gente. Invita a tus amigos para empezar.",
    invite: "Invita a tus amigos", inviteText: "Rela es mejor con tu gente: comparte el enlace.", profileOf: (n: string) => `Perfil de ${n}`,
    share: "Compartir invitación", copied: "✓ Enlace copiado", shareText: "Puntúa tus discos canción a canción conmigo en Rela",
  },
  notFound: { title: "No encontramos esta página", text: "Puede que el disco ya no esté en el catálogo.", other: "Busca otro" },
  time: { now: "ahora", h: (n: number) => `hace ${n} h`, d: (n: number) => `hace ${n} d`, mo: (n: number) => `hace ${n} mes`, y: (n: number) => `hace ${n} a` },
  errors: {
    login: "Inicia sesión para hacer esto.", noRecord: "No encontramos este disco.", top4Full: "Tu top 4 está lleno. Quita uno desde tu perfil.",
    reviewLong: "La reseña es demasiado larga (máximo 5.000 caracteres).", badReaction: "Reacción no válida.", writeSomething: "Escribe algo antes de responder.",
    replyLong: "La respuesta es demasiado larga (máximo 1.000 caracteres).", cantPublish: "No se pudo publicar.", selfFollow: "No puedes seguirte a ti.",
    sql003: "Falta ejecutar el archivo 003 en Supabase.", handleFormat: "El usuario debe tener entre 3 y 24 caracteres: letras minúsculas, números, punto o guion bajo.",
    handleOwn: "Elige un nombre de usuario propio.", bioLong: "La bio puede tener como máximo 160 caracteres.", handleTaken: "Ese nombre de usuario ya está cogido.",
  },
};

export type Dict = typeof es;

const en: Dict = {
  meta: { description: "Rate your records track by track, read what people think and share your scores." },
  nav: { home: "Home", explore: "Explore", friends: "Friends", myProfile: "My profile", profile: "Profile", search: "Search", enter: "Sign in", searchPh: "Albums, singles or artists", searchLabel: "Search", homeLabel: "Rela, home", main: "Main", tabs: "Tabs" },
  footer: { beta: "Rela · beta version. Catalogue: Deezer.", privacy: "Privacy", terms: "Terms", language: "Language" },
  kind: { album: "Album", single: "Single", ep: "EP", compile: "Compilation", disc: "Record" },
  tier: { under: "Underground", culto: "Cult", conocido: "Known", main: "Mainstream" },
  common: {
    coverOf: (t) => `Cover of ${t}`, song: "Song", songs: (n) => `${n} ${n === 1 ? "song" : "songs"}`,
    min: "min", you: "You", friend: "Friend", seeAll: "See all", translate: "Translate", translateTitle: "Translate with Google Translate",
    fansDeezer: (n) => `${n} fans on Deezer`, yourVoteCounts: "Your score really matters here.", tracksN: (n) => `${n} ${n === 1 ? "song" : "songs"}`,
  },
  home: {
    title1: "Rate your records.", title2: "Track by track.",
    intro: "Keep a diary of what you listen to, see what people think and share your scores on stories.",
    createProfile: "Create my free profile", fresh: "New releases · just out", freshError: "New releases couldn't be loaded. Try again in a while.",
    forYou: "For you · songs from your niche", forYouCount: (n) => `Based on the ${n} artists you follow`, forYouOff: "Follow artists to turn it on",
    because: (n) => `Because you follow ${n}`, followArtistsTitle: "Follow your favourite artists",
    followArtistsText: "Search for an artist and tap “Follow artist”: we'll recommend songs from similar acts here, especially small ones.",
    searchArtists: "Search artists", trending: "Trending reviews", byInteraction: "Sorted by interaction",
    noReviews: "No reviews yet. Open a record, rate it and write the first one.", friendsNews: "What your friends are rating", manageFriends: "Manage friends",
    friendsNothing: "Your friends haven't rated anything yet.", noFollowing: "You don't follow anyone yet.", findFriends: "Find friends",
    chart: "Most played right now", chartSub: "Deezer top",
  },
  search: {
    title: "Search", resultsFor: "Results for", anyRecord: "Search any record",
    intro: "The whole Deezer catalogue: albums, singles and EPs, from the biggest hits to artists with a handful of listeners.",
    artists: "Artists", records: "Records", all: "All", albums: "Albums", singles: "Singles & EPs", none: "No results. Try another name.",
  },
  album: {
    notFound: "Record not found", metaDesc: (t, a) => `Rate ${t} by ${a} track by track and see what people think on Rela.`,
    avgOf: (n, one) => `Average of ${n} ${one ? "score" : "scores"} on Rela`, nobody: "Nobody has rated it yet: be the first",
    reviewsN: (n) => `${n} ${n === 1 ? "review" : "reviews"}`, distribution: "Score distribution",
    featured: "Featured review", reviewsTitle: "Reviews & debate", reviewsIntro: "React and reply: reviews with the most interaction rise to the top.",
    noReviews: "No reviews for this record yet. Yours could be the first.", yourFriends: "Your friends",
    friendsRated: (a, b) => `${a} of ${b} have rated it`, noFriendRated: "Nobody you follow has rated it yet.",
  },
  rater: {
    rateTracks: "Rate it track by track", rateTracksSub: "Slide to score from 1 to 10. Star your favourite.",
    rateTrack: "Rate the song", rateTrackSub: "Slide to score from 1 to 10.",
    lyricsOf: (t) => `Lyrics of ${t} on Genius`, lyrics: "Lyrics on Genius", favOf: (t) => `Mark ${t} as favourite`, scoreOf: (t) => `Score for ${t}`,
    yourScore: "Your score", avgOf: (a, b) => `Average of ${a} of ${b} songs:`, rateToAvg: "Rate the songs and we'll work out the average.",
    useAvg: "Use the average", final: "Final score", listened: "Listened", liked: "Like", inTop4: "★ In your top 4", addTop4: "Add to top 4",
    inLoop: "↻ On repeat", setLoop: "I have it on repeat", lyricsGenius: "Lyrics on Genius ↗",
    removedTop4: "Removed from your top 4", addedTop4: "Added to your top 4", removedLoop: "Removed from “on repeat”", addedLoop: "Now shown on your profile as “on repeat”",
    saving: "Saving…", saved: "✓ Saved to your profile", saveError: "Couldn't save. Check your connection.", autosave: "Your score saves itself to your profile.",
    enter: "Sign in", enterToSave: "to save your score to your profile so your friends can see it.",
  },
  reviews: {
    sorts: { hot: "Featured", new: "Newest", top: "Most voted", debate: "Most divisive" },
    notes: {
      hot: "Featured: likes, reactions and replies, with more weight on recent ones.", new: "The latest to be posted.",
      top: "The ones with the most interaction.", debate: "Where the most people agree and disagree at once.",
    },
    reacts: { like: "Like", fuego: "Fire", acuerdo: "Agree", discrepo: "Disagree" },
    replies: (n) => `${n} ${n === 1 ? "reply" : "replies"}`, debate: "Divisive",
    enterToReact: "Sign in to react to reviews.", enterToReply: "Sign in to reply.", replyTo: (n) => `Reply to ${n}…`, thisReview: "this review",
    writeReply: "Write a reply", reply: "Reply", enter: "Sign in", toReply: "to reply.", report: "Report review", reported: "Thanks. We'll review it.",
    composerEnter: "to write your review and react to other people's.", placeholder: "What did you think? It'll show next to your score.", yourReview: "Your review",
    hasReview: "You already have a review: edit it, or leave it empty to delete it.", climb: "Reviews with the most interaction rise to the top.",
    publishing: "Posting…", update: "Update review", publish: "Post review",
    published: "Review posted. If it gets reactions, it'll climb in Featured.", deleted: "Review deleted.",
  },
  artist: {
    label: "Artist", followersRela: (n, one) => `${n} ${one ? "follower" : "followers"} on Rela`,
    albumsN: (n) => `${n} albums`, singlesN: (n) => `${n} singles & EPs`, albums: "Albums", noAlbums: "No albums in the catalogue.",
    singles: "Singles & EPs", niche: "Artists in their niche", ifYouLike: (n) => `If you like ${n}`,
    follow: "+ Follow artist", following: "✓ Following", followed: (n) => `You follow ${n}. We'll recommend music from their niche on your home page.`, unfollowed: (n) => `You unfollowed ${n}.`,
  },
  follow: { follow: "Follow", following: "✓ Following" },
  login: {
    title: "Sign in", heading: "Sign in to Rela", intro: "Save your scores, write reviews, follow your friends and customise your profile.",
    failed: "Couldn't sign in", retry: "Try again. If you used email, open the link in this same browser.", tech: "Technical message:",
    errVerifier: "You opened the link in another browser or app. Request a new link and open it in this same browser.",
    errExpired: "The link has expired or was already used. Request a new one.",
    errProvider: "Google sign-in isn't enabled in Supabase (Authentication → Sign In / Providers → Google).",
    errDenied: "You cancelled, or Google didn't allow it (check the app is published or your email is a test user).",
    notConfigured: "Accounts aren't set up yet: the Supabase variables are missing in Vercel.",
    googleOff: "Google sign-in isn't enabled yet. Use your email for now.", rate: "Too many emails sent. Wait a few minutes and try again.",
    google: "Continue with Google", orEmail: "or with your email", sent: (e) => `We've sent a link to ${e}. Open it in this same browser to sign in. Check your spam folder too.`,
    email: "Email", sending: "Sending…", sendLink: "Email me a sign-in link", noPasswords: "No passwords: you get a link and you're in. If it's your first time, we create your account.",
  },
  profile: {
    notFound: "Profile not found", metaDesc: (h) => `@${h}'s profile on Rela`, edit: "Edit profile", inLoop: "On repeat:",
    records: "Records", avg: "Average score", reviews: "Reviews", followers: "Followers", following: "Following",
    compat: "Music compatibility", compatNone: "Rate at least 2 records in common to work it out.",
    compatText: (n, v) => `You've rated ${n} records in common. ${v >= 80 ? "Music twins." : v >= 60 ? "Good match: you'll discover things from each other." : "Very different tastes: perfect for leaving your bubble."}`,
    badges: "Badges", myTop4: "My top 4", top4Of: (n) => `${n}'s top 4`, addFromAlbum: "Add them from each record's page", pickRecord: "+ Pick a record",
    myArtists: "Artists I follow", theirArtists: "Artists they follow", myReviews: "My reviews", reviewsOf: (n) => `${n}'s reviews`, likesReceived: (n) => `♥ ${n} received`,
    common: "Records in common", commonSub: (n) => `${n} · you`, myRecords: "My records", recordsOf: (n) => `${n}'s records`,
    emptyOwn: "You haven't rated anything yet.", searchRecord: "Search for a record", emptyOwn2: "and get started.", emptyOther: "Hasn't rated any records yet.",
    howRates: "How they rate", size: "Size of what they listen to",
    badge: {
      under: ["Underground hunter", "A third of their records are by artists with under 10,000 fans"], culto: ["Cult ear", "3 or more records by cult artists"],
      strict: ["Tough critic", "Average score below 7"], heart: ["Easy heart", "Likes almost everything"],
      first: ["First steps", "Has rated their first record"], meloman: ["Music lover", "More than 50 records rated"],
    },
  },
  editProfile: {
    title: "Edit profile", create: "Create your profile", intro: "This is how your friends will see you. Add your photo, a header and your colour.",
    welcome: "Welcome to Rela!", welcomeText: "Pick your username and add a photo to your profile. You can change it whenever you like.",
    uploading: "Uploading…", changeBanner: "Change header", remove: "Remove", uploadPhoto: "Upload photo", removePhoto: "Remove photo",
    name: "Name", namePh: "How you want people to see you", handle: "Username", handleHint: (h) => `3 to 24 characters: lowercase letters, numbers, dot or underscore. Your profile will be rela…/u/${h}`,
    bio: "Bio", bioPh: "Desert-island records, gigs, quirks…", city: "City", color: "Profile colour", colorOf: (c) => `Colour ${c}`,
    signOut: "Sign out", saving: "Saving…", save: "Save profile", onlyImages: "Upload an image (JPG or PNG).",
    uploadError: (m) => `Couldn't upload the image: ${m}. If it says "Bucket not found", file 002 still needs to be run in Supabase.`,
  },
  friends: {
    title: "Friends", intro: "Follow people with good taste, see what they listen to and compare your scores with theirs.", notConfigured: "Accounts aren't set up yet.",
    searchPeople: "Search people", searchPh: "Name, @username or city", search: "Search", results: "Results", noMatch: (q) => `Nobody matches “${q}”. Invite them with your link.`,
    following: "Following", noFollowing: "You don't follow anyone yet. Search for your friends or check the suggestions.", enter: "Sign in",
    enterToFollow: "to follow your friends and see their scores on your home page.", newPeople: "New people on Rela", fewPeople: "There aren't many people yet. Invite your friends to get started.",
    invite: "Invite your friends", inviteText: "Rela is better with your people: share the link.", profileOf: (n) => `${n}'s profile`,
    share: "Share invite", copied: "✓ Link copied", shareText: "Rate your records track by track with me on Rela",
  },
  notFound: { title: "We couldn't find this page", text: "The record may no longer be in the catalogue.", other: "Search for another" },
  time: { now: "now", h: (n) => `${n} h ago`, d: (n) => `${n} d ago`, mo: (n) => `${n} mo ago`, y: (n) => `${n} y ago` },
  errors: {
    login: "Sign in to do this.", noRecord: "We couldn't find this record.", top4Full: "Your top 4 is full. Remove one from your profile.",
    reviewLong: "The review is too long (5,000 characters max).", badReaction: "Invalid reaction.", writeSomething: "Write something before replying.",
    replyLong: "The reply is too long (1,000 characters max).", cantPublish: "Couldn't post it.", selfFollow: "You can't follow yourself.",
    sql003: "File 003 still needs to be run in Supabase.", handleFormat: "Usernames must be 3 to 24 characters: lowercase letters, numbers, dot or underscore.",
    handleOwn: "Pick your own username.", bioLong: "Bios can be 160 characters at most.", handleTaken: "That username is already taken.",
  },
};

export const DICTS: Record<Lang, Dict> = { es, en };
export const isLang = (v: unknown): v is Lang => v === "es" || v === "en";

export function timeAgoT(t: Dict, iso: string) {
  const h = (Date.now() - new Date(iso).getTime()) / 3.6e6;
  if (h < 1) return t.time.now;
  if (h < 24) return t.time.h(Math.round(h));
  const d = Math.round(h / 24);
  return d < 30 ? t.time.d(d) : d < 365 ? t.time.mo(Math.round(d / 30)) : t.time.y(Math.round(d / 365));
}

export const translateUrl = (text: string, lang: Lang) =>
  `https://translate.google.com/?sl=auto&tl=${lang}&op=translate&text=${encodeURIComponent(text.slice(0, 4500))}`;
