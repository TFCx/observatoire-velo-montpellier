---
title: Tutoriel - Dupliquer Cyclopolis dans sa ville
description: Guide à destination des associations qui souhaiteraient réutiliser Cyclopolis pour suivre les infrastructures cyclables de leur ville.
imageUrl: /cyclopolis.png
---

## Cyclopolis est (et restera) Open Source

Depuis le tout début de son histoire, en septembre 2022, Cyclopolis est un projet Open Source. Cela signifie que tout le code de la plateforme est public et réutilisable par tous et toutes.

Le code est directement disponible sur [GitHub](https://github.com/lavilleavelo/cyclopolis) et réutilisable sous [licence MIT](https://github.com/benoitdemaegdt/voieslyonnaises/blob/main/LICENSE.md).

Une association (ou même un particulier) peut donc tout à fait copier le code de la plateforme, le modifier, l'adapter à sa ville, et le publier sous un autre nom.

## Combien ça coûte d'avoir son propre Cyclopolis ?

La version actuelle de Cyclopolis demande peu de ressources et coûte donc très peu cher à faire tourner.

En particulier :
- il n'y a pas de base de données (les données sont stockées sur Github).
- il n'y a pas de serveur dédié.
- il n'y a pas besoin de logiciel tiers payant.

Aujourd'hui, le seul coût financier est le nom de domaine (~10€/an).

Voici la liste des outils tiers utilisés :
- [GitHub](https://github.com) pour le stockage des données et du code. Gratuit.
- [Netlify](https://www.netlify.com) pour l'hébergement du site. Gratuit (free tier très largement suffisant).
- [Etalab](https://openmaptiles.geo.data.gouv.fr/) pour les cartes. Gratuit.
- [Geojson.io](https://geojson.io) pour le tracé des pistes cyclables. Gratuit.
- [Beam Analytics](https://beamanalytics.io/) pour le suivi d'audience. Gratuit (free tier très largement suffisant).
- ~[Cloudinary](https://cloudinary.com/) pour le stockage des images. Gratuit.~
- Serveur d'image de La Ville à Vélo pour le stockage des images. Payant mais mutualisé avec les autres besoins de l'association.

## Comment créer ma version de Cyclopolis ?

⚠️ *Attention, à partir d'ici ça devient un peu plus technique. L'aide d'un(e) développeur(euse) sera nécessaire.*

### 1 - Contactez-nous

Ça nous fait toujours plaisir de savoir que notre plateforme sert à d'autres personnes.
N'hésitez pas à nous envoyer un email. On pourra également vous donner quelques conseils.

### 2 - Visualisez ce tutoriel vidéo pas à pas
En partenariat avec la FUB, nous avons organisé en juin 2024 un webinaire dédié au déploiement de la plateforme open source « Cyclopolis » dans les autres agglomérations françaises de manière à aider le plaidoyer local.

Vous pouvez retrouver la vidéo complète du tutoriel ci-dessous :
[![Vidéo Tutoriel Cyclopolis](https://img.youtube.com/vi/vZ-tY7TG7PM/0.jpg)](https://www.youtube.com/watch?v=vZ-tY7TG7PM)

*En complément, vous pouvez retrouver ce tutoriel étape par étape ci-dessous.*

### 2.1 - Clonez le site

Vous pouvez cloner le site directement sur votre poste local.
```
git clone git@github.com:lavilleavelo/cyclopolis.git
```

Puis installer les dépendances
```
npm install
```

Puis le faire tourner en local
```
npm run dev
```

ça y est : vous avez votre clone de Cyclopolis qui tourne sur votre poste.
```
http://localhost:3000
```

### 2.2 - Adaptez Cyclopolis à votre ville

#### Centrez la carte sur votre ville

Depuis le fichier **Map.vue**, remplacez les coordonnées de Lyon par celles de votre ville.
```
center: [4.8312188, 45.757198]
```

#### Modifiez les données

Toutes les données de Cyclopolis sont stockées dans le code, dans le dossier **/content**.

On y retrouve plusieurs sous-dossiers :
- **/blog** - contient les articles du blog.
- **/compteurs** - contient le relevé des compteurs vélo lyonnais.
- **/voies-cyclables** - contient le tracé et le descriptif de chacune des Voies Lyonnaises (pistes cyclables structurantes).


Le plus intéressant ici, c'est donc le dossier **/content/voies-cyclables**. Il contient :
- des fichiers **json**, qui contiennent de la donnée structurée (le tracé des pistes cyclables).
- des fichiers markdown **.md**, qui contiennent du texte (les pages descriptives des infrastructures cyclables).

Il va donc vous falloir éditer tous ces fichiers pour les adapter à votre ville et à vos infrastructures cyclables.

Pour modifier les tracés des pistes cyclables, vous pouvez utiliser un outil comme [geojson.io](https://geojson.io). À noter que c'est assez long et laborieux, il y a peut-être des outils plus adaptés qui existent ...

#### Déployez votre toute nouvelle plateforme

Une fois que vous avez adapté les données à votre ville, vous pouvez déployer votre plateforme.

On recommande d'utiliser [Netlify](https://www.netlify.com) ou [Vercel](https://vercel.com/) pour l'hébergement. L'offre gratuite de ces 2 plateformes est très généreuse et suffira largement pour ce genre de projet.
Par ailleurs, elles offrent une excellente intégration avec Github. Ainsi, à chaque modification de vos données (ou commit), les changements seront "live" en 30-40 secondes.

Voici par exemple la configuration de Cyclopolis sur Netlify (section Build & Deploy):
```
Build command : npm run generate
Publish directory : dist
```

Et voilà!

Vous pouvez ensuite :
- acheter un nom de domaine pour votre plateforme.
- configurer un outil de suivi d'audience (on utilise Beam Analytics, mais il y a plein d'autres solutions).


## Conclusion

On vous souhaite tout le meilleur pour votre projet ! 🎉







