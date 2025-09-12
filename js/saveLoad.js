export class SaveLoadController {
    constructor() {
        this.dataFilePath = 'assets/data.json';
        this.collisionMesh = null;
        this.app = null; // Reference to main app for panel data
    }

    setCollisionMesh(collisionMesh) {
        this.collisionMesh = collisionMesh;
        console.log('Collision mesh set for save/load system');
        
        // Auto-load transform data when mesh is set
        this.loadTransform();
    }

    setApp(app) {
        this.app = app;
        console.log('App reference set for save/load system');
    }

    // Save current collider transform and text panels to JSON file
    async saveTransform() {
        if (!this.collisionMesh) {
            console.warn('No collision mesh to save');
            return false;
        }

        try {
            const data = {
                // Collider transform data
                colliderTransform: {
                    position: {
                        x: this.collisionMesh.position.x,
                        y: this.collisionMesh.position.y,
                        z: this.collisionMesh.position.z
                    },
                    rotation: {
                        x: this.collisionMesh.rotation.x,
                        y: this.collisionMesh.rotation.y,
                        z: this.collisionMesh.rotation.z
                    },
                    scale: {
                        x: this.collisionMesh.scale.x,
                        y: this.collisionMesh.scale.y,
                        z: this.collisionMesh.scale.z
                    }
                },
                // Text panels data (including URLs)
                textPanels: this.app ? this.app.savePanelsData() : [],
                // Metadata
                savedAt: new Date().toISOString(),
                version: "1.2" // Updated version for URL support
            };

            // Create the JSON content
            const jsonContent = JSON.stringify(data, null, 2);

            // Create a download link for the JSON file
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log('Data saved:', data);
            console.log(`Saved ${data.textPanels.length} text panels`);
            console.log('Please place the downloaded data.json file in the assets/ folder');
            
            return true;
        } catch (error) {
            console.error('Failed to save data:', error);
            return false;
        }
    }

    // Load collider transform and text panels from JSON file
    async loadTransform() {
        if (!this.collisionMesh) {
            console.warn('No collision mesh to load transform to');
            return false;
        }

        try {
            const response = await fetch(this.dataFilePath);
            
            if (!response.ok) {
                console.log('No saved data found (data.json not found)');
                return false;
            }

            const data = await response.json();

            // Handle legacy format (pre-text panels)
            if (data.position && !data.colliderTransform) {
                // Legacy format - convert to new format
                this.loadLegacyFormat(data);
                return true;
            }

            // Load collider transform
            if (data.colliderTransform) {
                const transform = data.colliderTransform;

                if (transform.position) {
                    this.collisionMesh.position.set(
                        transform.position.x || 0,
                        transform.position.y || 0,
                        transform.position.z || 0
                    );
                }

                if (transform.rotation) {
                    this.collisionMesh.rotation.set(
                        transform.rotation.x || 0,
                        transform.rotation.y || 0,
                        transform.rotation.z || 0
                    );
                }

                if (transform.scale) {
                    this.collisionMesh.scale.set(
                        transform.scale.x || 1,
                        transform.scale.y || 1,
                        transform.scale.z || 1
                    );
                }
            }

            // Load text panels (including URLs)
            if (data.textPanels && this.app) {
                this.app.loadPanelsData(data.textPanels);
            }

            console.log('Data loaded successfully:', data);
            console.log(`Data saved at: ${data.savedAt || 'Unknown'}`);
            console.log(`Data version: ${data.version || 'Legacy'}`);
            console.log(`Loaded ${data.textPanels ? data.textPanels.length : 0} text panels`);
            
            return true;
        } catch (error) {
            console.error('Failed to load data:', error);
            return false;
        }
    }

    // Load legacy format (backwards compatibility)
    loadLegacyFormat(legacyData) {
        console.log('Loading legacy format data...');

        if (legacyData.position) {
            this.collisionMesh.position.set(
                legacyData.position.x || 0,
                legacyData.position.y || 0,
                legacyData.position.z || 0
            );
        }

        if (legacyData.rotation) {
            this.collisionMesh.rotation.set(
                legacyData.rotation.x || 0,
                legacyData.rotation.y || 0,
                legacyData.rotation.z || 0
            );
        }

        if (legacyData.scale) {
            this.collisionMesh.scale.set(
                legacyData.scale.x || 1,
                legacyData.scale.y || 1,
                legacyData.scale.z || 1
            );
        }

        console.log('Legacy data converted and loaded');
    }

    // Get current transform data (for debugging)
    getCurrentTransform() {
        if (!this.collisionMesh) {
            return null;
        }

        return {
            colliderTransform: {
                position: {
                    x: this.collisionMesh.position.x,
                    y: this.collisionMesh.position.y,
                    z: this.collisionMesh.position.z
                },
                rotation: {
                    x: this.collisionMesh.rotation.x,
                    y: this.collisionMesh.rotation.y,
                    z: this.collisionMesh.rotation.z
                },
                scale: {
                    x: this.collisionMesh.scale.x,
                    y: this.collisionMesh.scale.y,
                    z: this.collisionMesh.scale.z
                }
            },
            textPanels: this.app ? this.app.savePanelsData() : []
        };
    }

    // Reset transform to default values
    resetTransform() {
        if (!this.collisionMesh) {
            console.warn('No collision mesh to reset');
            return false;
        }

        this.collisionMesh.position.set(0, 0, 0);
        this.collisionMesh.rotation.set(0, 0, 0);
        this.collisionMesh.scale.set(1, 1, 1);

        // Clear all text panels
        if (this.app) {
            // Clear existing panels
            this.app.getPanels().forEach(panel => this.app.deletePanel(panel));
        }

        console.log('Transform and text panels reset to default values');
        return true;
    }
}