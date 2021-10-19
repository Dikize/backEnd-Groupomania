const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require("sequelize");
const fs = require('fs');
const models = require('../models');

// Regex 
const textRegex = /^[A-Za-z]{2,}$/
const emailRegex = /^[A-Za-z0-9_.+-]+\@[A-Za-z0-9_.+-]+\.[A-Za-z]+$/
const passwordRegex = /[\w]{7,30}/

// créer un compte
exports.signup = (req,res) => {
    // Obtenir les valeurs saisies
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const email = req.body.email;
    const password = req.body.password;

    // Regex verification 
    if(!textRegex.test(firstname)){
        return res.status(400).json({ error : "Le prénom ne doit contenir que des lettres" })
    }
    if(!textRegex.test(lastname)){
        return res.status(400).json({ error : "Le nom ne doit contenir que des lettres" })
    }
    if(!emailRegex.test(email)){
        return res.status(400).json({ error : "La syntaxe du mail n'est pas valide" + email });
    }
    if(!passwordRegex.test(password)){
        return res.status(400).json({ error : "Le mot de passe doit contenir entre 7 et 30 caractères" });
    }

    // chercher l'utilisateur par email
    models.User.findOne({ where: { email : email } })
        .then(user => {
            // Si l'utilisateur avec cet email existe déjà :
            if(user) {
                return res.status(401).json({ error : "L'adresse mail saisie est déjà utilisée"})
            // Else continue
            } else {
                // hash password 
                bcrypt.hash(password, 10)
                .then(hash => {
                    // Créer un utilisateur avec le mot de passe de hachage
                    models.User.create({
                        firstname: firstname,
                        lastname: lastname,
                        email: email,
                        password: hash,
                        isAdmin: false,
                    })
                    .then(() => res.status(201).json({ message: "Utilisateur créé" }))
                    .catch(err => res.status(400).json({ error: '' + err }))
                })
                .catch(err => res.status(500).json({ error : '' + err }))  }
        })
        .catch(err => res.status(500).json({ error : '' + err }))
}

// connexion au compte
exports.login = (req,res) => {

    // Obtenir les valeurs saisies
    const email = req.body.email;
    const password = req.body.password;

    // Chercher l'utilisateur dans la BD ?
    models.User.findOne( { where: { email : email } })
        .then(user => {
            // no
            if(!user){
                return res.status(404).json({ error: "Utilisateur non trouvé"})
            }
            // l'utilisateur est désactivé
            if(!user.isActive){
                return res.status(405).json({ error: "Votre compte est désactivé, veuillez contacter Administrator"})
            }
            // Tous est ok 
            bcrypt.compare(password, user.password)
            .then(valid => {
                // Le mot de passe est invalide
                if(!valid){
                    return res.status(401).json({ error: "Mot de passe incorrect"})
                }
                // return le token et l'userId
                return res.status(201).json({
                    userId: user.id,
                    isAdmin: user.isAdmin,
                    token: jwt.sign(
                        {userId : user.id},
                        process.env.SECRET_TOKEN,
                        { expiresIn: '12h'}) })
            })
            .catch(err => res.status(500).json({ error : `${err}` }))
        })
        .catch(err => res.status(500).json({ error : `${err}` }))
}

// afficher le profile
exports.getProfile = (req,res) => {
    // recuperer le token et le décoder
    const token = req.headers.authorization.split(' ')[1]; 
    const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    // Trouvez les attributs concernant l'ID décodé decodedToken.User  
    models.User.findOne({
        attributes: ['email', 'lastname', 'firstname', 'profilePicture', 'biography' ],
        where: { id : decodedToken.userId} 
    })
    .then(user => {
        if(!user){
            return res.status(404).json({error : 'Utilisateur non trouvé'})
        }
        res.status(200).send(user)
    })
    .catch(err => res.status(500).json({ error : err }))
}

// mettre à jour le profil
exports.updateProfile = (req,res) => {
    // recuperer le token et le décoder
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    // Trouvez l'ID qui est décodé decodedToken.User 
    models.User.findOne({ where : { id: decodedToken.userId}})
        .then(user => {
            // utilisateur non trouvé
            if(!user){
                return res.status(404).json({ error : "Utilisateur non trouvé "})
            }

            // obtenir les new valeur saisie par l'utilisateur
            const biography = req.body.biography ? req.body.biography : user.biography;
            const profilePicture = req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : user.profilePicture;

            // Mise à jour de la bio et photo profile
            user.update({ 
                biography: biography,
                profilePicture: profilePicture
            })
            .then(() => { res.status(200).json({ message: 'Profile mis à jour'}) })
            .catch(error => res.status(500).json({ error : `${error}` }));
        })
        .catch(error => res.status(500).json({ error : `${error}` }));
}

// Supprimer le compte
exports.deleteAccount = (req,res) => {
     // recuperer le token et le décoder
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN);

    // Trouvez l'utilisateur où l'ID qui est décodé Token.User ID  
    models.User.findOne({ where : { id : decodedToken.userId} })
        .then(user => {

            // utilisateur non trouvé
            if(!user){
                return res.status(404).json({ error: "Utilisateur non trouvé" })
            }

            // Trouver tous les articles créés par l'utilisateur
            models.Article.findAll({ where : { UserId : user.id }})
                .then(articles => {
                    
                    articles.forEach( article => {

                        // Supprimer les likes associé à l'article ou à l'utilisateur aime
                        models.Like.destroy({ where : {
                            [Op.or]: [
                                { ArticleId: article.id },
                                { UserId: user.id }] } 
                        }).then(() => res.status(200).json({ message: "Le like a bien été supprimé" }))
                        .catch(error => res.status(500).json({ error : `${error}` }));
    
                        // Supprimer un commentaire associé à l'article ou à l'utilisateur
                        models.Comment.destroy({ where : {
                            [Op.or]: [
                                { ArticleId: article.id },
                                { UserId: user.id }] } 
                        }).then(() => res.status(200).json({ message: "Les commentaires ont été bien supprimés" }))
                        .catch(error => res.status(500).json({ error : `${error}` }));
                    })

                    // Supprimer tout article créé par l'utilisateur spécifique
                    models.Article.destroy({ where : { UserId : user.id }})
                        .then(() => res.status(200).json({ message: "Les articles ont bien été supprimés" }))
                        .catch(error => res.status(500).json({ error : ' ' +error }));

                })
                .catch(error => res.status(500).json({ error : ' ' +error }));

                
            // Supprimer le profil et la photo utilisateur s'il en a
            let filename = user.profilePicture ? user.profilePicture.split('/images/')[1] : null;
            fs.unlink(`images/${filename}`, () => {
            
                // Supprimer l'utilisateur
                user.destroy({ where: { UserId : user.id } })
                    .then(() => {
                        res.status(200).json({ message: "L'utilisateur a bien été supprimé" })
                    })
                    .catch(error => res.status(500).json({ error : ' ' +error }));
            })

        })
        .catch(error => res.status(500).json({ error : `${error}` }));
}