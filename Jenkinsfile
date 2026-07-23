pipeline {
    agent any

    stages {
        stage('1. Pull Code') {
            steps {
                echo 'Pulling latest code...'
            }
        }

        stage('2. Build Project') {
            steps {
                echo 'Installing dependencies...'
                sh 'npm install'

                echo 'Building React production bundle without source maps...'
                sh 'DISABLE_ESLINT_PLUGIN=true CI=false GENERATE_SOURCEMAP=false npm run build'
            }
        }

        stage('3. Restart PM2 Process') {
            steps {
                echo 'Restarting application with PM2...'
                sh '''
                    # Pindah ke folder workspace
                    cd "/var/lib/jenkins/workspace/OCP UI"
                    
                    # Matikan proses lama jika ada
                    npx pm2 delete ocp-ui || true
                    
                    # Start aplikasi React build menggunakan npx serve
                    npx pm2 start "npx serve -s build -l 3000" --name "ocp-ui"
                '''
            }
        }
    }
}