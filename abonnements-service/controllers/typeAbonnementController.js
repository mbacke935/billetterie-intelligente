const { TypeAbonnement } = require('../models');

// Créer un nouveau type d'abonnement
exports.createTypeAbonnement = async (req, res) => {
  try {
    const { nom, tarif, duree_validite, voyages_initiaux } = req.body;

    // Validation basique
    if (!nom || tarif === undefined || !duree_validite) {
      return res.status(400).json({ message: 'Veuillez remplir tous les champs obligatoires (nom, tarif, duree_validite).' });
    }

    const nouveauType = await TypeAbonnement.create({
      nom,
      tarif,
      duree_validite,
      voyages_initiaux: nom === 'Illimité' ? null : voyages_initiaux
    });

    res.status(201).json(nouveauType);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du type d\'abonnement.', error: error.message });
  }
};

// Récupérer tous les types d'abonnement
exports.getAllTypeAbonnements = async (req, res) => {
  try {
    const types = await TypeAbonnement.findAll();
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des types d\'abonnement.', error: error.message });
  }
};

// Récupérer un type d'abonnement par ID
exports.getTypeAbonnementById = async (req, res) => {
  try {
    const typeAbonnement = await TypeAbonnement.findByPk(req.params.id);
    if (!typeAbonnement) {
      return res.status(404).json({ message: 'Type d\'abonnement non trouvé.' });
    }
    res.status(200).json(typeAbonnement);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du type d\'abonnement.', error: error.message });
  }
};

// Mettre à jour un type d'abonnement
exports.updateTypeAbonnement = async (req, res) => {
  try {
    const { nom, tarif, duree_validite, voyages_initiaux } = req.body;
    const typeAbonnement = await TypeAbonnement.findByPk(req.params.id);

    if (!typeAbonnement) {
      return res.status(404).json({ message: 'Type d\'abonnement non trouvé.' });
    }

    await typeAbonnement.update({
      nom: nom || typeAbonnement.nom,
      tarif: tarif !== undefined ? tarif : typeAbonnement.tarif,
      duree_validite: duree_validite || typeAbonnement.duree_validite,
      voyages_initiaux: nom === 'Illimité' ? null : (voyages_initiaux !== undefined ? voyages_initiaux : typeAbonnement.voyages_initiaux)
    });

    res.status(200).json(typeAbonnement);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du type d\'abonnement.', error: error.message });
  }
};

// Supprimer un type d'abonnement
exports.deleteTypeAbonnement = async (req, res) => {
  try {
    const typeAbonnement = await TypeAbonnement.findByPk(req.params.id);
    if (!typeAbonnement) {
      return res.status(404).json({ message: 'Type d\'abonnement non trouvé.' });
    }

    await typeAbonnement.destroy();
    res.status(200).json({ message: 'Type d\'abonnement supprimé avec succès.' });
  } catch (error) {
    // Gère le cas où des abonnements y sont liés
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ message: 'Impossible de supprimer ce type d\'abonnement car des abonnements y sont associés.' });
    }
    res.status(500).json({ message: 'Erreur lors de la suppression du type d\'abonnement.', error: error.message });
  }
};
