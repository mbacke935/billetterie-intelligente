const { Abonnement, TypeAbonnement, Voyage, sequelize } = require('../models');
const crypto = require('crypto');

// Valider un abonnement / ticket lors du passage d'un portillon ou d'un contrôle
exports.validerAbonnement = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { abonnement_id } = req.body;

    if (!abonnement_id) {
      await t.rollback();
      return res.status(400).json({ message: 'L\'identifiant de l\'abonnement (abonnement_id) est requis.' });
    }

    // Récupérer l'abonnement avec sa formule
    const abonnement = await Abonnement.findByPk(abonnement_id, {
      include: { model: TypeAbonnement, as: 'typeAbonnement' },
      transaction: t
    });

    if (!abonnement) {
      await t.rollback();
      return res.status(404).json({ message: 'Abonnement ou ticket non trouvé.' });
    }

    const type = abonnement.typeAbonnement;
    const dateActuelle = new Date();

    // 1. Vérifier si le statut est actif
    if (abonnement.statut !== 'Actif') {
      await t.rollback();
      return res.status(403).json({
        statut_validation: 'REFUSE',
        raison: `L'abonnement n'est pas actif. Statut actuel : ${abonnement.statut}`
      });
    }

    // 2. Vérifier si la date d'expiration est dépassée
    if (new Date(abonnement.date_expiration) < dateActuelle) {
      // Si expiré, on passe le statut à "Résilie" automatiquement pour la cohérence
      await abonnement.update({ statut: 'Résilie' }, { transaction: t });
      await t.commit();

      return res.status(403).json({
        statut_validation: 'REFUSE',
        raison: 'L\'abonnement est expiré. La date de validité est dépassée.'
      });
    }

    // 3. Traitement selon le type de formule (Ticket simple, Limité, Illimité)
    const estIllimite = type.nom === 'Illimité';
    let nouveauxVoyagesRestants = abonnement.voyages_restants;

    if (!estIllimite) {
      // Pour les tickets simples ou formules limitées, on vérifie s'il reste des voyages
      if (abonnement.voyages_restants <= 0) {
        await t.rollback();
        return res.status(403).json({
          statut_validation: 'REFUSE',
          raison: 'Solde de voyages épuisé. Veuillez recharger ou renouveler votre abonnement.'
        });
      }

      // Décrémenter les voyages restants
      nouveauxVoyagesRestants = abonnement.voyages_restants - 1;
    }

    // Incrémenter les voyages consommés
    const nouveauxVoyagesConsommes = abonnement.voyages_consommes + 1;

    // Déterminer le nouveau statut (ex: un ticket simple sans voyages restants est résilié/fermé)
    let nouveauStatut = abonnement.statut;
    if (!estIllimite && nouveauxVoyagesRestants === 0 && type.nom === 'Ticket simple') {
      nouveauStatut = 'Résilie';
    }

    // Mettre à jour l'abonnement
    await abonnement.update({
      voyages_restants: nouveauxVoyagesRestants,
      voyages_consommes: nouveauxVoyagesConsommes,
      statut: nouveauStatut
    }, { transaction: t });

    // 4. Générer un identifiant de validation unique
    const validationId = `VAL-${crypto.randomUUID().toUpperCase()}`;

    // 5. Enregistrer le voyage dans l'historique
    const nouveauVoyage = await Voyage.create({
      abonnement_id: abonnement.id,
      date_voyage: dateActuelle,
      validation_id: validationId
    }, { transaction: t });

    await t.commit();

    res.status(200).json({
      statut_validation: 'VALIDE',
      message: 'Validation réussie. Bon voyage !',
      details: {
        validation_id: validationId,
        date_validation: dateActuelle,
        formule: type.nom,
        voyages_restants: estIllimite ? 'Illimité' : nouveauxVoyagesRestants,
        voyages_consommes: nouveauxVoyagesConsommes,
        statut_abonnement: nouveauStatut
      }
    });

  } catch (error) {
    await t.rollback();
    res.status(500).json({
      statut_validation: 'ERREUR',
      message: 'Une erreur interne est survenue lors de la validation.',
      error: error.message
    });
  }
};
