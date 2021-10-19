const models = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require("sequelize");

// like article
exports.likeArticle = (req,res) => {
    // recuperer le token et le décoder
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    // Trouvez l'ID qui est décodé decodedToken.User 
    models.User.findOne({ where: { id: decodedToken.userId }})
        .then(user => {
            // utilisateur non trouvé
            if(!user){
                return res.status(404).json({ message : "Utilisateur non trouvé" })
            }

            // Trouver l'article par ID
            models.Article.findOne({ where: { id: req.params.articleid }})
                .then(article => {
                    // Article non trouvé
                    if(!article){
                        return res.status(404).json({ message : "Article non trouvé" })
                    }       
                    // trouver comme où l'article est article.id et UserId: user.id
                    models.Like.findOne({ where : {
                        [Op.and]: [
                            { ArticleId: article.id },
                            { UserId: user.id }
                        ]
                    }})
                        .then(like => {
                          // Comme non trouvé
                            if(!like){
                            // créer like avec l'utilisateur et l'article aimé
                                models.Like.create({
                                    UserId: user.id,
                                    ArticleId: article.id,
                                })
                                .then(() => res.status(201).json({ message: "Like row was created"}))
                                .catch(error => res.status(500).json({ error : `${error}` }))

                                // ajouter 1 like dans article 
                                article.update({
                                    likes : article.likes + 1
                                })
                                .then(() => res.status(200).json({ message: "Liked"}))
                                .catch(error => res.status(500).json({ error : `${error}` }))

                            // like existe déjà
                            } else {
                                // Supprime
                                like.destroy()
                                .then(() => res.status(200).json({ message : "Like row was deleted" }))
                                .catch(error => res.status(500).json({ error : `${error}`}))
                        
                                // Supprimer 1 like dans l'article 
                                article.update({
                                    likes : article.likes - 1
                                })
                                    .then(() => res.status(200).json({ message : "Like supprime" }))
                                    .catch(error => res.status(500).json({ error : `${error}`}))
                            }    
                        })
                        .catch(error => res.status(500).json({ error : `${error}` }))     
                })
                .catch(error => res.status(500).json({ error : `${error}` }))
        })
        .catch(error => res.status(500).json({ error : `${error}` }))
}
