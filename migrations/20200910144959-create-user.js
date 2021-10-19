'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstname: {
        allowNull: false,
        type: Sequelize.STRING,
        validate : {
          is: /[A-Za-z]{2,}/,
        }
      },
      lastname: {
        allowNull: false,
        type: Sequelize.STRING,
        validate : {
          is: /[A-Za-z]{2,}/, 
        }
      },
      email: {
        unique: true,
        allowNull: false,
        type: Sequelize.STRING,
        validate : {
          is: /[A-Za-z0-9_.+-]+@[A-Za-z0-9_.+-]+\.[A-Za-z]+/
        }
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING
      },
      profilePicture: {
        allowNull: true,
        type: Sequelize.STRING
      },
      biography: {
        allowNull: true,
        type: Sequelize.STRING
      },
      isAdmin: {
        defaultValue: 0,
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      isActive: {
        defaultValue: 1,
        allowNull: false,
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        get() {
          return moment(this.getDataValue('createdAt')).format('DD/MM/YYYY h:mm:ss');
        }
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        get() {
          return moment(this.getDataValue('updatedAt')).format('DD/MM/YYYY h:mm:ss');
        }
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};