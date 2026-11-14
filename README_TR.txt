ARENA IO 3D - KURULUM (WINDOWS)

GEREKENLER
1) Node.js LTS sürümünü resmi sitesinden kur: https://nodejs.org/
2) Kurulumdan sonra Windows Başlat menüsünden "Komut İstemi"ni aç.

OYUNU BAŞLATMA
1) Bu ZIP dosyasını masaüstüne çıkar.
2) Komut İstemi'nde şu komutları sırayla yaz:

   cd %USERPROFILE%\Desktop\arena_io_3d
   npm install
   npm start

3) Ekranda "Arena IO 3D hazır: http://localhost:3000" yazısını gör.
4) Tarayıcıda http://localhost:3000 adresini aç.
5) Oyuncu adını yaz ve OYUNA KATIL düğmesine bas.

KONTROLLER
- W A S D veya ok tuşları: hareket
- Parlayan mavi enerji kürelerine yaklaş: puan kazan ve büyü

ARKADAŞLARLA TEST
- Aynı Wi-Fi ağındaki arkadaşların, senin bilgisayarının yerel IP adresini kullanarak
  http://BILGISAYAR_IP_ADRESI:3000 adresinden bağlanabilir.
- İnternet üzerinden farklı ağlardan oynamak için oyunu güvenilir bir Node.js sunucusuna
  dağıtmak gerekir. Bu başlangıç sürümü henüz herkese açık internete dağıtılmamıştır.

NOT
Bu özgün bir başlangıç prototipidir; popüler .io oyunlarından esinlenen temel arena
ve küre toplama mekaniğini kullanır, onların marka/karakterlerini kopyalamaz.
