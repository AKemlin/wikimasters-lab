# WikiMasters Lab — version web

Tableau de bord statique pour suivre ses cartes WikiMasters, son budget en WikiBidou et la popularité des articles Wikipédia associés.

## Utilisation

Ouvrir le site GitHub Pages publié. Les données sont enregistrées **dans le stockage local du navigateur**. Elles ne sont pas envoyées à GitHub et ne suivent pas automatiquement un autre appareil ou navigateur. Utiliser « Exporter mes données » pour faire une sauvegarde JSON, puis « Importer une sauvegarde » sur l'autre appareil. Un export du prototype local (`wiki-masters-lab-export.json`) peut également être importé.

La mesure de hype interroge directement l'API publique Wikimedia Pageviews. Elle compare les sept derniers jours disponibles aux sept jours précédents. Les prix et les ventes sont saisis manuellement. Le simulateur ouvre des cartes fictives seulement et ne se connecte pas au compte WikiMasters.

## Publication GitHub Pages

Ce dossier est autonome. GitHub Pages peut le publier depuis la racine de la branche `main` (Settings → Pages → Deploy from a branch → `main` / `root`). Les chemins CSS et JavaScript sont relatifs afin de fonctionner sous l'URL `https://<compte>.github.io/<depot>/`.

## Sources et limites

- [WikiMasters](https://www.wiki-masters.com/)
- [Conditions de WikiMasters](https://www.wiki-masters.com/terms) : l'automatisation peut entraîner une suspension ; les objets virtuels n'ont pas de valeur monétaire réelle.
- [Wikimedia Analytics API](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/tutorials/compare-page-metrics.html)
