use instant::Instant;

#[derive(Clone, Debug)]
pub struct DamageEntry {
    pub timestamp: Instant,
    pub damage: i64,
}

#[derive(Clone, Debug)]
pub struct HealingEntry {
    pub timestamp: Instant,
    pub healing: i64,
}

#[derive(Clone, Debug)]
pub struct DamageTakenEntry {
    pub timestamp: Instant,
    pub damage: i64,
}
