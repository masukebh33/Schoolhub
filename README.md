# SchoolHub - Mfumo wa Usimamizi wa Shule

## Kuendesha
1. Weka Python 3.9+
2. `pip install -r requirements.txt`
3. `python app.py`
4. Fungua http://localhost:5000

## Akaunti za awali (zibadilishe mara moja!)
- Msimamizi: `admin` / `admin123`
- Mwalimu: `mwalimu` / `mwalimu123`

## Vilivyomo
Dashibodi (takwimu halisi kutoka database), Wanafunzi, Walimu, Madarasa, Mahudhurio, Mitihani, Maktaba, Ada, Usafiri, Ujumbe, Mipangilio.
Login yenye majukumu: mwalimu haoni Ada, Walimu wala Usafiri, na hawezi kufuta rekodi.
Data zimehifadhiwa kwenye `schoolhub.db` (SQLite).

## Kabla ya kutumia kweli
Weka `SECRET_KEY` yako: `export SECRET_KEY="neno-refu-la-siri"` na tumia HTTPS (mfano nginx + gunicorn).

## Vercel
Faili za tovuti ziko kwenye `public/`. Weka `SECRET_KEY` kwenye Environment Variables.
Tahadhari: Vercel haihifadhi SQLite, data hufutika. Inafaa kwa onyesho tu.
