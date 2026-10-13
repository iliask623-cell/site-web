# MIZANIA — Conformité réglementaire (dossier de travail)

> Ce document est un **dossier de travail technique**, pas un avis juridique. Il recense les textes à analyser,
> les questions ouvertes et ce que l'application prévoit. Les conclusions juridiques doivent être validées par
> un professionnel compétent, à partir des textes officiels consolidés.

## Processus de vérification d'une règle

1. La règle est saisie au statut `to_verify`, avec sa source (`official_sources`) et une note de provenance.
2. Une personne habilitée la confronte au **texte officiel** (Journal officiel, DGI, ministère) et à ses modifications.
3. Elle la passe en `verified` : la base exige alors une source et une date de vérification, et l'auteur est enregistré.
4. Quand le texte change, on crée une **nouvelle version** avec sa date d'effet et on clôt l'ancienne (`valid_to`). La base interdit que deux versions vérifiées se chevauchent.

Seules les règles `verified` sont utilisées dans un calcul ou un contrôle bloquant.

## 1. Facturation (droit commercial)

| Texte | Statut dans MIZANIA |
|---|---|
| Décret exécutif n° 05-468 du 10 décembre 2005 (JO n° 80 du 11/12/2005) — établissement de la facture, du bon de transfert, du bon de livraison et de la facture récapitulative | Source enregistrée, à vérifier |
| Décret exécutif n° 16-66 du 16 février 2016 — document tenant lieu de facture | Source enregistrée, à vérifier |

17 mentions **candidates** sont enregistrées (vendeur, acheteur, document, lignes), toutes « à vérifier ». Elles proviennent de votre cahier des charges et, pour certaines (forme juridique, RC, NIS, total en lettres), d'une source secondaire. Questions ouvertes :
- liste exacte des mentions et identifiants exigés (vendeur **et** acheteur) selon la qualité des parties ;
- mentions propres aux opérations exonérées ;
- forme de la correction d'une facture émise (avoir, annulation) ;
- durée de conservation des factures.

## 2. Fiscalité

Catalogue enregistré : TVA, IBS, IRG, TAP, IFU — **sans aucun taux ni seuil**.

À documenter pour chaque règle : nom de l'impôt, taux, conditions, exonérations, seuils, date d'entrée en vigueur, texte et article, date de dernière vérification. Sources : documentation DGI (TVA notamment), Code des impôts, **lois de finances successives** (et complémentaires). Une liste de taux trouvée sur Internet ne suffit pas : les règles dépendent de l'activité, du régime et de la nature de l'opération.

Comportement de l'application : sans profil fiscal déclaré, **aucune règle fiscale n'est appliquée automatiquement** (testé).

## 3. Comptabilité (SCF)

Textes recensés (d'après le document du ministère des Finances fourni) : loi n° 07-11 du 25/11/2007 ; décret exécutif n° 08-156 du 26/05/2008 ; **décret exécutif n° 09-110 du 07/04/2009** (comptabilité tenue au moyen de systèmes informatiques — prioritaire pour un logiciel) ; arrêtés du 26/07/2008 (nomenclature et règles de fonctionnement des comptes ; seuils des petites entités) ; instruction ministérielle n° 02 du 29/10/2009.

## 4. Protection des données personnelles

Textes : **loi n° 18-07 du 10 juin 2018**, modifiée et complétée par la **loi n° 25-11 du 24 juillet 2025**. Il faut travailler sur la version consolidée. Autorité : ANPDP.

D'après des sources secondaires **non vérifiées** (veille juridique, presse), la loi 25-11 introduirait notamment l'obligation de désigner un **délégué à la protection des données** ainsi que de nouvelles notions (violation de données, profilage, pseudonymisation). À confirmer dans le JO.

| Point à analyser | Ce que MIZANIA prévoit techniquement |
|---|---|
| Obligations du responsable du traitement (MIZANIA vis-à-vis de ses utilisateurs ; l'utilisateur vis-à-vis de ses propres clients et fournisseurs) | Registre des traitements à rédiger ; rôles à qualifier juridiquement |
| Droits des personnes (information, accès, rectification, opposition…) | Profil modifiable ; export des données ; suppression de compte et d'organisation (cascade en base) |
| Conditions de collecte (minimisation) | Onboarding progressif ; identifiants fiscaux facultatifs |
| Durées de conservation | Paramétrables une fois fixées (attention aux obligations de conservation comptables et commerciales) |
| Mesures de sécurité | Isolation par organisation (RLS forcée), Argon2id, sessions hachées, validation serveur, rate limiting, journaux sans données sensibles |
| Formalités auprès de l'ANPDP (déclaration / autorisation) | À déterminer avant ouverture au public |
| Hébergement ou transfert à l'étranger | **Point bloquant à trancher** : choix de l'hébergeur et du fournisseur IA |
| Sous-traitants (hébergement, email, IA) | Contrats et garanties à examiner ; IA désactivée par défaut par organisation, activation explicite après information |
| Violations de données | Procédure de notification à définir |

## 5. Services techniques tiers

- **Email transactionnel** : Resend ou Brevo. Comparer offres, conditions, localisation des données, et vérifier le domaine d'envoi. L'intégration technique couvrira les deux. Le compte et la clé sont à créer par vous.
- **IA** : clé API stockée **uniquement** en variable d'environnement côté serveur, jamais dans le code envoyé au navigateur, dans le dépôt ou dans un message.
