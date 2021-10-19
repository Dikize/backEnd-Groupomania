const models = require('../models');
const jwt = require('jsonwebtoken');
const fs = require('fs')
const { Op } = require("sequelize");

// Créer un article
exports.createArticle = (req,res) => {
    // recuperer le token et le décoder
    const token = req.headers.authorization.split(' ')[1]; 
    const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    models.User.findOne({ where : { id : decodedToken.userId } })
        .then(user => {
            // utilisateur non trouvé
            if(!user){
                return res.status(404).json({ error : "Utilisateur non trouvé" });
            }
            // obtenir les new valeur saisie par l'utilisateur
            const content = req.body.content;
            const attachment = req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}`: null;

            // Créer un article
            models.Article.create({ 
                content : content,
                attachment : attachment,
                UserId : user.id
            })
            .then(() =>  res.status(201).json({ message: "L'article a bien été créé" }))
            .catch(error => res.status(400).json({ error : `${error}` }));
        })
        .catch(error => res.status(400).json({ error : `${error}` }))
    
}

// get tous les articles de l'utilisateur
exports.getAllArticles = (req,res) => {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    // Trouvez l'ID qui est décodé decodedToken.User 
    models.User.findOne({ where: {id : decodedToken.userId} })
        .then(user => {
            // Si l'utilisateur introuvable
            if(!user){
                return res.status(404).json({ error : "Utilisateur non trouvé" })
            }
            // get tous les article
            models.Article.findAll({
                // Inclure l'utilisateur qui a créé l'article
                include : [
                    {
                        model: models.User,
                        attributes: ['firstname','lastname','profilePicture'],
                        where: { id: {[Op.col] : 'Article.UserId'}}
                    },
                    // Inclure les commentaires de l'article
                    {
                        model: models.Comment,
                        where: { ArticleId: {[Op.col] : 'Article.id'} },
                        // Inclure l'utilisateur qui a créé des commentaires
                        include : {
                            model: models.User,
                            attributes: ['firstname','profilePicture']
                        },
                        // Commentaires non requis
                        required: false
                    }
                ],
                order: [
                    ['id', 'DESC'],
                ],
            })
            .then(article =>  {
                // Si l'article n'est pas trouvé
                if(!article){
                    return res.status(404).json({ error: "Article non trouvé" })
                }
                let isAdmin = user.isAdmin
                res.status(200).send({article, isAdmin})
            })
            .catch(error => res.status(400).json({ error: `${error}` }));

        })
        .catch(error => res.status(500).json({ error : `${error}` }));
    
}

// get un article spécifique
exports.getOneArticle = (req,res) => {

    // Obtenez un article par son identifiant
    models.Article.findOne({ where : 
        {id : req.params.id },
        // Inclure l'utilisateur qui a créé l'article
        include : [{
            model: models.User,
            attributes: ['firstname','profilePicture'],
            where: {
                id: {[Op.col] : 'Article.UserId'}
            }
        },
         // Inclure les commentaires de l'article
        {
            model: models.Comment,
            where: {
                ArticleId: {[Op.col] : 'Article.id'}
            },
            // include user who created comments
            include : [{
                model: models.User,
                attributes: ['firstname','profilePicture'],
            }],
            // Commentaires non requis
            required: false
        }]
    })
        .then(article =>  {
            // if article non trouvé
            if(!article){
                return res.status(404).json({ error: "Article non trouvé" })
            }
            res.status(200).send(article)})
        .catch(error => res.status(400).json({ error: `${error}` }));
}

exports.updateArticle = (req,res) => {
    // recuperer le token et le décoder
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    // Trouvez l'ID qui est décodé decodedToken.User 
    models.User.findOne({ where : { id : decodedToken.userId }})
        .then(user => {
            // if utilisateur non trouvé
            if(!user){
                return res.status(404).json({ error: "Utilisateur non trouvé" })
            }
            // sinon trouver l'article où l'id est en paramètres
            models.Article.findOne({ where : { id : req.params.id }})
                .then(article => {
                    // erreur si l'article non trouvé
                    if(!article){
                        return res.status(404).json({ error: "Article non trouvé" })
                    }

                    // Saisie 
                    let content = req.body.content ? req.body.content : article.content;
                    let attachment = req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : article.attachment;

                    // si l'utilisateur à d'articles
                    if(article.UserId !== user.id) {
                        return res.status(401).json({ error: "Action impossible" })
                    }
                    
                    // Mise à jour de l'article avec la new saisie
                    article.update({
                        content : content,
                        attachment : attachment
                    })
                    .then(() => res.status(200).json({ message: "L'article a été mis à jour" }))
                    .catch(error => res.status(500).json({ error: `${error}` }))
                })
                .catch(error => res.status(500).json({ error: `${error}` }));
        })
        .catch(error => res.status(500).json({ error : `${error}` }));
}     

// delete article
exports.deleteArticle = (req,res) => {
    // recuperer le token et le décoder
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    // Trouvez l'ID qui est décodé decodedToken.User 
    models.User.findOne({ where: {id : decodedToken.userId} })
        .then(user => {
            // Si l'utilisateur introuvable
            if(!user){
                return res.status(404).json({ error : "Utilisateur non trouvé" })
            }
            // else cherche l'article de l'ID decodé decodedToken.userId
            models.Article.findOne({ where : { id : req.params.id } })
                .then(article => {

                    // Si l'article non trouvé
                    if(!article){
                        return res.status(404).json({ error : "Article non trouvé" })
                    }

                     // Vérifiez si l'utilisateur à créer d'articles ou administrateur
                    if(user.id !== article.UserId && !user.isAdmin) {
                        return res.status(401).json({ error : "Action impossible" })
                    }

                    // Supprimer les commentaires associés à l'article
                    models.Comment.destroy({ where : { ArticleId : article.id }})
                        .then(() => res.status(200).json({ message: "Tous les commentaires ont été supprimés" }))
                        .catch(error => res.status(500).json({ error: `${error}` }))

                    // Supprimer le like associé à l'article
                    models.Like.destroy({ where : {ArticleId: article.id}})
                        .then(() => res.status(200).json({ message: "Like a été supprimé" }))
                        .catch(error => res.status(500).json({ error : `${error}` }));

                    // Supprimer l'image de l'article s'il y en a 1
                    let filename = article.attachment ? article.attachment.split('/images/')[1] : null;
                    fs.unlink(`images/${filename}`, () => {
                        // Supprimer l'article
                        article.destroy()
                            .then(() => {
                                res.status(200).json({ message: "L'article a été supprimé" })
                            })
                            .catch(error => res.status(500).json({ error : `${error}` }));
                    })

                })
                .catch(error => res.status(500).json({ error : `${error}`}))
        })
        .catch(error => res.status(500).json({ error : `${error}` }))
}