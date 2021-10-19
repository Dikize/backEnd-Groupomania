const models = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require("sequelize");

// créer un commentaire
exports.createComment = (req,res) => {
    // recuperer le token et le décoder
    let token = req.headers.authorization.split(" ")[1]
    let decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    // Trouvez l'ID qui est décodé decodedToken.User 
    models.User.findOne({ where : { id : decodedToken.userId } })
        .then(user => {
            // if utilisateur non trouvé
            if(!user){
                return res.status(404).json({ error : " Utilisateur non trouvé" })
            }
            // sinon trouver l'article où id est en paramètres
            models.Article.findOne({ where : { id : req.params.articleid } })
                .then(article => {
                    // if utilisateur non trouvé
                    if(!article){
                        return res.status(404).json({ error : " Article non trouvé" })
                    }

                    // créer un commentaire 
                    models.Comment.create({
                        commentText: req.body.comment,
                        UserId : user.id,
                        ArticleId : article.id
                    })
                    .then(() =>  res.status(201).json({ message: "Comment was created" }))
                    .catch(error => res.status(500).json({ error : `${error}` }));
                })
                .catch(error => res.status(500).json({ error : `${error}` }))
        })
        .catch(error => res.status(500).json({ error : `${error}` }))
}

// get tous les commentaires
exports.getComments = (req,res) => {
    let token = req.headers.authorization.split(" ")[1]
    let decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    // Trouvez l'ID qui est décodé decodedToken.User 
    models.User.findOne({ where : { id: decodedToken.userId }})
        .then(user => {
            // if utilisateur non trouvé
            if(!user){
                return res.status(404).json({ error: "Utilisateur non trouvé" })
            }
            
            models.Article.findOne({ where : { id: req.params.articleid }})
                .then(article => {
                    // if Article non trouvé
                    if(!article){
                        return res.status(404).json({ error: "Article non trouvé" })
                    }
                    // Trouver tous les commente comment.ArticleId is article.id
                    models.Comment.findAll({ where : 
                        { ArticleId : article.id },
                        // inclure l'utilisateur qui a commenté
                        include : {
                            model: models.User,
                            attributes: ['firstname', 'lastname', 'profilePicture'],
                            where: {
                                id: {[Op.col] : 'Comment.UserId'}
                            }
                        }
                    })
                        .then(comments => {
                            let isAdmin = user.isAdmin
                            res.status(200).send({comments, isAdmin})
                        })
                        .catch(error => res.status(500).json({ error : `${error}` }))
                })
                .catch(error => res.status(500).json({ error : `${error}` }))
        })
        .catch(error => res.status(500).json({ error : `${error}` }))
}

// update selected comment
exports.updateComment = (req,res) => {
    // recuperer le token et le décoder
    let token = req.headers.authorization.split(" ")[1];
    let decodedToken = jwt.verify(token, process.env.SECRET_TOKEN)

    // Trouvez l'ID qui est décodé decodedToken.User 
    models.User.findOne({where : { id : decodedToken.userId }})
        .then(user => {
            // if utilisateur non trouvé
            if(!user){
                return res.status(404).json({ error: "Utilisateur non trouvé" })
            }
            // Trouver l'article par ID
            models.Article.findOne({ where : { id: req.params.articleid }})
                .then(article => {
                      // if Article non trouvé
                    if(!article){
                        return res.status(404).json({ error: "Article non trouvé" })
                    }
                    // Trouver un commentaire par ID
                    models.Comment.findOne({ where : { id : req.params.id } })
                        .then(comment => {
                            // if Commentaire non trouvé
                            if(!comment){
                                return res.status(404).json({ error: "Commentaire non trouvé" })
                            }
                            // Vérifiez si l'utilisateur est le créateur de commentaire
                            if(comment.UserId !== user.id){
                                return res.status(401).json({ error: "Action impossible" })
                            }
                            // Commentaire de la mise à jour
                            comment.update({
                                commentText: req.body.comment
                            })
                            .then(() => res.status(201).json({ message: "Commentaire a été mis à jour" }))
                            .catch(error => res.status(500).json({ error : `${error}` }))
                        })
                        .catch(error => res.status(500).json({ error : `${error}` }))
                })
                .catch(error => res.status(500).json({ error : `${error}` }))

        })
        .catch(error => res.status(500).json({error : `${error}`}))
}

// Supprimer le commentaire sélectionné
exports.deleteComment = (req,res) => {
    // recuperer le token et le décoder
    let token = req.headers.authorization.split(" ")[1];
    let decodedToken = jwt.verify(token, process.env.SECRET_TOKEN)

    // Trouvez l'ID qui est décodé decodedToken.User 
    models.User.findOne({ where : { id : decodedToken.userId }})
        .then(user => {
            // if utilisateur non trouvé
            if(!user){
                return res.status(404).json({ error: "Utilisateur non trouvé" })
            }
            // find article by id
            models.Article.findOne({ where : { id: req.params.articleid }})
                .then(article => {
                    // if Article non trouvé
                    if(!article){
                        return res.status(404).json({ error: "Article non trouvé" })
                    }

                    // Trouver un commentaire par ID
                    models.Comment.findOne({ where : { id : req.params.id } })
                        .then(comment => {
                            // if Commentaire non trouvé
                            if(!comment){
                                return res.status(404).json({ error: "Commentaire non trouvé" })
                            }
                            // Vérifiez si l'utilisateur est le créateur du commentaire ou administrateur
                            if(comment.UserId !== user.id && !user.isAdmin){
                                return res.status(401).json({ error: "Action impossible" })
                            }
                            // Supprimer le commentaire
                            comment.destroy()
                            .then(() => res.status(200).json({ message: "Le commentaire a été supprimé" }))
                            .catch(error => res.status(500).json({ error : `${error}` }))
                        })
                        .catch(error => res.status(500).json({ error : `${error}` }))
                })
                .catch(error => res.status(500).json({ error : `${error}` }))

        })
        .catch(error => res.status(500).json({error : `${error}`}))
}