pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
            }
        }
        stage('Build') {
            steps {
                sh 'echo "Compile code here"'
            }
        }
        stage('Test') {
            steps {
                sh 'echo "Run automated unit tests here"'
            }
        }
    }
}