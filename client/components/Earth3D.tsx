import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface ClimateAction {
  id: string;
  latitude: number;
  longitude: number;
  impact_co2_saved?: number;
}

interface Earth3DProps {
  onLocationClick?: (lat: number, lon: number) => void;
  actions?: ClimateAction[];
  isPreview?: boolean;
}

export const Earth3D: React.FC<Earth3DProps> = ({
  onLocationClick,
  actions = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const actionPointsRef = useRef<THREE.Points | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000a14);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 2.5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: "lowp",
    });
    rendererRef.current = renderer;
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Create Earth sphere using realistic textures (color, bump, specular) and add cloud layer
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Placeholder material while textures load
    const material = new THREE.MeshPhongMaterial({
      color: 0x223344,
      shininess: 10,
    });

    const globe = new THREE.Mesh(geometry, material);
    globeRef.current = globe;
    scene.add(globe);

    // Load textures asynchronously for realism
    const loader = new THREE.TextureLoader();
    const colorMap =
      "https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg";
    const bumpMap = "https://threejs.org/examples/textures/earthbump1k.jpg";
    const specMap = "https://threejs.org/examples/textures/earthspec1k.jpg";
    const cloudMap =
      "https://threejs.org/examples/textures/fair_clouds_2048.png";

    // Safely load maps and apply when available
    loader.load(
      colorMap,
      (tex) => {
        globe.material.map = tex;
        globe.material.needsUpdate = true;
      },
      undefined,
      () => {
        // ignore load errors, keep placeholder
      },
    );

    loader.load(
      bumpMap,
      (tex) => {
        globe.material.bumpMap = tex;
        globe.material.bumpScale = 0.03;
        globe.material.needsUpdate = true;
      },
      undefined,
      () => {},
    );

    loader.load(
      specMap,
      (tex) => {
        globe.material.specularMap = tex;
        globe.material.specular = new THREE.Color(0x444444);
        globe.material.needsUpdate = true;
      },
      undefined,
      () => {},
    );

    // Add semi-transparent cloud layer for realism
    loader.load(
      cloudMap,
      (cloudTex) => {
        const cloudGeo = new THREE.SphereGeometry(1.01, 64, 64);
        const cloudMat = new THREE.MeshPhongMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        const clouds = new THREE.Mesh(cloudGeo, cloudMat);
        clouds.name = "clouds";
        scene.add(clouds);

        // Slight rotation for clouds during animation
        (globe as any).clouds = clouds;
      },
      undefined,
      () => {},
    );

    // Create atmosphere (subtle glow)
    const atmosphereGeometry = new THREE.SphereGeometry(1.05, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x7fc8ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);

    // Create background particles for ambience
    const particleCount = 150;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI;
      const radius = 1.1;

      positions[i] = Math.sin(theta) * Math.cos(phi) * radius;
      positions[i + 1] = Math.cos(theta) * radius;
      positions[i + 2] = Math.sin(theta) * Math.sin(phi) * radius;

      velocities[i] = (Math.random() - 0.5) * 0.001;
      velocities[i + 1] = (Math.random() - 0.5) * 0.001;
      velocities[i + 2] = (Math.random() - 0.5) * 0.001;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    particleGeometry.setAttribute(
      "velocity",
      new THREE.BufferAttribute(velocities, 3),
    );

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x4db8d9,
      size: 0.015,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particlesRef.current = particles;
    scene.add(particles);

    // Action points (dynamic, based on props)
    const actionGeometry = new THREE.BufferGeometry();
    const actionMaterial = new THREE.PointsMaterial({
      color: 0xffd166,
      size: 0.022,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const actionPoints = new THREE.Points(actionGeometry, actionMaterial);
    actionPointsRef.current = actionPoints;
    scene.add(actionPoints);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(3, 2, 5);
    scene.add(sunLight);

    const glow = new THREE.PointLight(0x4db8d9, 0.5, 10);
    glow.position.copy(sunLight.position);
    scene.add(glow);

    // Mouse tracking
    const onMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const onWindowResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const onClick = (event: MouseEvent) => {
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(mouseRef.current.x, mouseRef.current.y);
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(globe);
      if (intersects.length > 0) {
        const point = intersects[0].point.normalize();
        const lat = Math.asin(point.y);
        const lon = Math.atan2(point.z, point.x);
        if (onLocationClick) {
          onLocationClick(lat, lon);
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onWindowResize);
    window.addEventListener("click", onClick);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Gentle rotation
      rotationRef.current.x +=
        (mouseRef.current.y * 0.2 - rotationRef.current.x) * 0.05;
      rotationRef.current.y +=
        (mouseRef.current.x * 0.2 - rotationRef.current.y) * 0.05;

      // Apply a subtle axial tilt for realism and gentle interactive rotation
      const tilt = 0.41; // ~23.5 degrees
      globe.rotation.x = tilt + rotationRef.current.x * 0.001;
      globe.rotation.y += rotationRef.current.y * 0.001;

      // Rotate cloud layer slightly faster for parallax effect
      if ((globe as any).clouds) {
        (globe as any).clouds.rotation.y +=
          0.0008 + rotationRef.current.y * 0.0002;
      }

      atmosphere.rotation.copy(globe.rotation);

      // Update particles
      if (particles.geometry.getAttribute("position")) {
        const positions = particles.geometry.getAttribute("position")
          .array as Float32Array;
        const velocities = particles.geometry.getAttribute("velocity")
          .array as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          // Keep particles near the globe
          const dist = Math.sqrt(
            positions[i] * positions[i] +
              positions[i + 1] * positions[i + 1] +
              positions[i + 2] * positions[i + 2],
          );

          if (dist > 1.5) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const radius = 1.1;
            positions[i] = Math.sin(theta) * Math.cos(phi) * radius;
            positions[i + 1] = Math.cos(theta) * radius;
            positions[i + 2] = Math.sin(theta) * Math.sin(phi) * radius;
          }
        }
        particles.geometry.getAttribute("position").needsUpdate = true;
      }

      // Render
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("click", onClick);
      cancelAnimationFrame(animationId);
      containerRef.current?.removeChild(renderer.domElement);

      // Dispose globe and its textures if present
      try {
        if (globe.material) {
          const mat: any = globe.material;
          if (mat.map) mat.map.dispose();
          if (mat.bumpMap) mat.bumpMap.dispose();
          if (mat.specularMap) mat.specularMap.dispose();
          mat.dispose();
        }
      } catch (e) {}

      // Dispose clouds if any
      try {
        const clouds = scene.getObjectByName("clouds") as
          | THREE.Mesh
          | undefined;
        if (clouds) {
          if ((clouds.material as any).map)
            (clouds.material as any).map.dispose();
          (clouds.geometry as any).dispose();
          (clouds.material as any).dispose();
          scene.remove(clouds);
        }
      } catch (e) {}

      geometry.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      actionGeometry.dispose && actionGeometry.dispose();
      actionMaterial.dispose();
      renderer.dispose();
    };
  }, [onLocationClick]);

  // Update action points when actions prop changes
  useEffect(() => {
    if (!actionPointsRef.current) return;
    const pts = actionPointsRef.current;
    const actionsList = actions || [];
    const posArray = new Float32Array(actionsList.length * 3);

    const toCartesian = (lat: number, lon: number, radius = 1.02) => {
      // lat, lon in degrees expected but earlier code converted in radians. Ensure callers pass degrees.
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return [x, y, z];
    };

    actionsList.forEach((a, i) => {
      const lat = a.latitude;
      const lon = a.longitude;
      const [x, y, z] = toCartesian(lat, lon, 1.02);
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
    });

    pts.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3),
    );
    pts.geometry.getAttribute("position").needsUpdate = true;
  }, [actions]);

  return (
    <div
      ref={containerRef}
      className="w-full h-screen"
      style={{ position: "relative" }}
    />
  );
};
