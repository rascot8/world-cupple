import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: { translation: { "Play Daily Match": "Play Daily Match", "Next Match in": "Next Match in", "Leaderboard": "Leaderboard", "Score": "Score", "Play Again": "Play Again", "Sign in with Google": "Sign in with Google", "Email": "Email", "Password": "Password", "Sign Up": "Sign Up", "Sign In": "Sign In", "Logout": "Logout", "Rank": "Rank", "Football Points": "Football Points", "Global Leaderboard": "Global Leaderboard", "Back": "Back", "Question": "Question", "of": "of" } },
  es: { translation: { "Play Daily Match": "Jugar Partido Diario", "Next Match in": "Siguiente Partido en", "Leaderboard": "Clasificación", "Score": "Puntuación", "Play Again": "Jugar de Nuevo", "Sign in with Google": "Iniciar sesión con Google", "Email": "Correo electrónico", "Password": "Contraseña", "Sign Up": "Registrarse", "Sign In": "Iniciar Sesión", "Logout": "Cerrar sesión", "Rank": "Rango", "Football Points": "Puntos de Fútbol", "Global Leaderboard": "Clasificación Mundial", "Back": "Volver", "Question": "Pregunta", "of": "de" } },
  fr: { translation: { "Play Daily Match": "Jouer le match quotidien", "Next Match in": "Prochain match dans", "Leaderboard": "Classement", "Score": "Score", "Play Again": "Rejouer", "Sign in with Google": "Se connecter avec Google", "Email": "Email", "Password": "Mot de passe", "Sign Up": "S'inscrire", "Sign In": "Se Connecter", "Logout": "Déconnexion", "Rank": "Rang", "Football Points": "Points de Football", "Global Leaderboard": "Classement Mondial", "Back": "Retour", "Question": "Question", "of": "sur" } },
  de: { translation: { "Play Daily Match": "Tägliches Spiel spielen", "Next Match in": "Nächstes Spiel in", "Leaderboard": "Bestenliste", "Score": "Ergebnis", "Play Again": "Nochmal spielen", "Sign in with Google": "Mit Google anmelden", "Email": "E-Mail", "Password": "Passwort", "Sign Up": "Registrieren", "Sign In": "Anmelden", "Logout": "Abmelden", "Rank": "Rang", "Football Points": "Fußballpunkte", "Global Leaderboard": "Weltweite Bestenliste", "Back": "Zurück", "Question": "Frage", "of": "von" } },
  pt: { translation: { "Play Daily Match": "Jogar Partida Diária", "Next Match in": "Próxima partida em", "Leaderboard": "Classificação", "Score": "Pontuação", "Play Again": "Jogar Novamente", "Sign in with Google": "Entrar com o Google", "Email": "E-mail", "Password": "Senha", "Sign Up": "Inscrever-se", "Sign In": "Entrar", "Logout": "Sair", "Rank": "Classificação", "Football Points": "Pontos de Futebol", "Global Leaderboard": "Classificação Global", "Back": "Voltar", "Question": "Pergunta", "of": "de" } },
  ar: { translation: { "Play Daily Match": "العب المباراة اليومية", "Next Match in": "المباراة التالية في", "Leaderboard": "المتصدرين", "Score": "النتيجة", "Play Again": "العب مرة أخرى", "Sign in with Google": "الدخول بحساب جوجل", "Email": "البريد الإلكتروني", "Password": "كلمة المرور", "Sign Up": "تسجيل", "Sign In": "تسجيل الدخول", "Logout": "تسجيل خروج", "Rank": "مرتبة", "Football Points": "نقاط كرة القدم", "Global Leaderboard": "لوحة الصدارة العالمية", "Back": "رجوع", "Question": "سؤال", "of": "من" } },
  ja: { translation: { "Play Daily Match": "デイリーマッチをプレイ", "Next Match in": "次の試合まで", "Leaderboard": "リーダーボード", "Score": "スコア", "Play Again": "もう一度プレイ", "Sign in with Google": "Googleでサインイン", "Email": "メールアドレス", "Password": "パスワード", "Sign Up": "サインアップ", "Sign In": "サインイン", "Logout": "ログアウト", "Rank": "ランク", "Football Points": "フットボールポイント", "Global Leaderboard": "グローバルリーダーボード", "Back": "戻る", "Question": "質問", "of": "の" } },
  it: { translation: { "Play Daily Match": "Gioca la Partita Quotidiana", "Next Match in": "Prossima partita in", "Leaderboard": "Classifica", "Score": "Punteggio", "Play Again": "Gioca di nuovo", "Sign in with Google": "Accedi con Google", "Email": "Email", "Password": "Password", "Sign Up": "Iscriviti", "Sign In": "Accedi", "Logout": "Esci", "Rank": "Rango", "Football Points": "Punti Calcio", "Global Leaderboard": "Classifica Globale", "Back": "Indietro", "Question": "Domanda", "of": "di" } },
  nl: { translation: { "Play Daily Match": "Speel Dagelijkse Wedstrijd", "Next Match in": "Volgende wedstrijd in", "Leaderboard": "Klassement", "Score": "Score", "Play Again": "Opnieuw spelen", "Sign in with Google": "Aanmelden met Google", "Email": "E-mail", "Password": "Wachtwoord", "Sign Up": "Aanmelden", "Sign In": "Inloggen", "Logout": "Uitloggen", "Rank": "Rang", "Football Points": "Voetbalpunten", "Global Leaderboard": "Wereldwijd Klassement", "Back": "Terug", "Question": "Vraag", "of": "van" } },
  zh: { translation: { "Play Daily Match": "进行每日比赛", "Next Match in": "下一场比赛在", "Leaderboard": "排行榜", "Score": "得分", "Play Again": "再玩一次", "Sign in with Google": "使用Google登录", "Email": "电子邮件", "Password": "密码", "Sign Up": "注册", "Sign In": "登录", "Logout": "登出", "Rank": "排名", "Football Points": "足球积分", "Global Leaderboard": "全球排行榜", "Back": "返回", "Question": "问题", "of": "的" } }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    }
  });

export default i18n;
