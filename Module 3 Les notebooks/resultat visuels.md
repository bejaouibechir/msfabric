## 📊 Image 1 — Évolution temporelle de la consommation (30 jours)

Les trois sites **Industrie** dominent nettement en volume (1,5 – 2,5 MW), avec un profil régulier et des cycles hebdomadaires bien visibles :

 la consommation chute systématiquement les week-ends, signe d'une activité industrielle strictement calée sur les jours ouvrés.

 Les sites **Commercial** affichent un comportement plus stable (~0,6 – 0,9 MW) avec moins de variance. 

Les sites **Résidentiel** restent en dessous de 0,35 MW avec une légère tendance à la hausse en milieu de période, probablement liée aux conditions météo.

 **Conclusion opérationnelle** : les sites industriels sont les leviers prioritaires pour tout programme d'effacement ou d'optimisation.

## 📊 Image 2 — KPIs comparatifs (taux de charge, anomalies, prédiction)

Trois enseignements distincts ressortent. Sur le **taux de charge**, SITE_RES_001 et SITE_RES_002 affichent les taux les plus élevés relativement à leur capacité (~48 %), ce qui est contre-intuitif — cela s'explique par leur faible capacité installée (0,6–0,8 MW) face à une consommation constante. 

Sur les **anomalies**, SITE_COM_001 se distingue avec un taux à 1,94 %, soit le double de la moyenne — à surveiller. 

Sur l'**erreur de prédiction**, les sites industriels sont les mieux prédits (<20 %), tandis que SITE_IND_001 présente la valeur la plus élevée (~58 %), indiquant que son comportement est moins régulier et que le modèle de prévision mérite d'être affiné sur ce site.

---

## 📊 Image 3 — Sensibilité au prix et gains d'effacement

Le scatter gauche ne montre **pas de corrélation linéaire forte** entre prix spot et consommation — les sites ne réduisent pas spontanément leur activité quand le prix monte, ce qui justifie pleinement la mise en place de **signaux d'effacement actifs**.

 Sur les gains potentiels, SITE_IND_001 représente le gisement dominant avec **~100 k€** de gain potentiel sur 30 jours, contre ~69 k€ pour SITE_IND_002. 

Ces deux sites industriels flexibles concentrent 100 % du potentiel d'effacement. **Conclusion** : un programme d'effacement ciblé sur SITE_IND_001 seul permettrait de valoriser l'essentiel du potentiel financier du parc.

---

## 📊 Image 4 — Heatmap Heure × Jour de la semaine

La heatmap révèle une **structure de consommation très lisible** en trois zones. La plage 8h–19h en semaine (rouge foncé, ~1,4 MW) correspond au pic d'activité industrielle et commerciale. 

La nuit (0h–6h) et les week-ends (orange pâle, ~0,6–0,8 MW) représentent les creux — idéaux pour les opérations de maintenance ou de recharge. On note une **légère asymétrie** : le vendredi soir décroche plus tôt que les autres jours ouvrés, et le samedi matin maintient une activité résiduelle jusqu'à 10h. 

Ces patterns sont exploitables directement pour configurer des **plages d'effacement automatiques** dans le système de supervision.

---

## 📊 Image 5 — Alertes et anomalies opérationnelles

Le graphique gauche montre que les **"Prix spot très élevé"** génèrent de loin le plus grand volume d'alertes (majoritairement priorité HAUTE), devant les erreurs de prédiction (MOYENNE) et les consommations anormales (mix HAUTE/CRITIQUE).

 La timeline droite confirme que les alertes critiques se concentrent sur **deux périodes distinctes** dans le mois — des pics de prix ponctuels probablement liés à des tensions réseau. 

L'absence d'alertes CRITIQUE hors de ces fenêtres est rassurant : le parc fonctionne normalement 90 % du temps. **Action recommandée** : paramétrer des notifications automatiques sur les créneaux historiquement à risque identifiés sur la timeline.
