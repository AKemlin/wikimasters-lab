# WikiMasters Lab — version web

Tableau de bord statique pour suivre ses cartes WikiMasters, son budget en WikiBidou et la popularité des articles Wikipédia associés.

## Utilisation

Ouvrir le site GitHub Pages publié. Les données sont enregistrées **dans le stockage local du navigateur**. Elles ne sont pas envoyées à GitHub et ne suivent pas automatiquement un autre appareil ou navigateur. Utiliser « Exporter mes données » pour faire une sauvegarde JSON, puis « Importer une sauvegarde » sur l'autre appareil. Un export du prototype local (`wiki-masters-lab-export.json`) peut également être importé.

La mesure de hype interroge l'API publique de Wikipédia. Elle compare les sept derniers jours disponibles aux sept jours précédents. Si le navigateur bloque l'API, ouvrir « Modifier » sur la carte et saisir les vues des deux semaines à l'aide du lien « Voir les vues Wikipédia ». Les prix et les ventes sont saisis manuellement. Le simulateur ouvre des cartes fictives seulement et ne se connecte pas au compte WikiMasters.

## Acheter & vendre

Dans « Acheter & vendre », saisir une carte à surveiller avec un prix de référence observé et, éventuellement, une offre repérée. Choisir une marge cible et des frais éventuels. Le tableau calcule :

- Achat maximum = `plancher(prix de référence × (1 − frais) / (1 + marge cible))`.
- Revente minimum = `plafond(coût saisi × (1 + marge cible) / (1 − frais))`.

Ces nombres ne sont que des seuils personnels. Ils ne disent pas qu'une carte se vendra au prix de référence, ni que l'offre est encore disponible. La hype Wikipédia n'entre pas dans les formules. Pour une carte issue d'un paquet, renseigner son coût attribué si un seuil de revente est souhaité, mais éviter de compter ce coût deux fois dans le budget.

Le simulateur possède les commandes Lancer, Pause/Reprendre et Arrêter. Il utilise uniquement les données de démonstration locales. Aucun identifiant WikiMasters n'est demandé ou stocké.

## Publication GitHub Pages

Ce dossier est autonome. GitHub Pages peut le publier depuis la racine de la branche `main` (Settings → Pages → Deploy from a branch → `main` / `root`). Les chemins CSS et JavaScript sont relatifs afin de fonctionner sous l'URL `https://<compte>.github.io/<depot>/`.

## Sources et limites

- [WikiMasters](https://www.wiki-masters.com/)
- [Conditions de WikiMasters](https://www.wiki-masters.com/terms) : l'automatisation peut entraîner une suspension ; les objets virtuels n'ont pas de valeur monétaire réelle.
- [Règles de la communauté](https://www.wiki-masters.com/rules) : les bots ouvrant des paquets ou interagissant à la place d'un joueur sont interdits.
- [Wikimedia Analytics API](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/tutorials/compare-page-metrics.html)


