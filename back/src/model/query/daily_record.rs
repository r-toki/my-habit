use crate::lib::my_error::*;
use crate::model::lib::*;

use chrono::NaiveDate;
use derive_new::new;
use serde::Serialize;
use sqlx::{query, PgPool};

#[derive(new, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DailyRecordDto {
    pub comment: String,
    pub recorded_on: NaiveDate,
    pub habit_daily_records: Vec<HabitDailyRecordDto>,
}

#[derive(new, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HabitDailyRecordDto {
    pub done: bool,
    pub habit_id: String,
    pub habit_name: String,
}

pub async fn find_daily_record(
    pool: &PgPool,
    user_id: String,
    recorded_on: NaiveDate,
) -> MyResult<DailyRecordDto> {
    let daily_record = query!(
        "
        select id, comment, recorded_on from daily_records
        where user_id = $1
        and recorded_on = $2
        ",
        user_id.clone(),
        recorded_on.clone()
    )
    .fetch_optional(pool)
    .await?;

    match daily_record {
        Some(daily_record) => {
            let habit_daily_records = query!(
                r#"
                select h_d_r.done "done?", h.id "habit_id!", h.name "habit_name!" from habits h
                left outer join habit_daily_records h_d_r
                on h.id = h_d_r.habit_id
                where h.user_id = $1
                and (h.archived_at is null or h.archived_at > $2)
                and h.created_at < $3
                order by h.created_at
                "#,
                user_id.clone(),
                start_of_date(recorded_on),
                end_of_date(recorded_on)
            )
            .fetch_all(pool)
            .await?;

            let habit_daily_records: Vec<HabitDailyRecordDto> = habit_daily_records
                .into_iter()
                .map(|v| {
                    HabitDailyRecordDto::new(v.done.unwrap_or(false), v.habit_id, v.habit_name)
                })
                .collect();

            let daily_record =
                DailyRecordDto::new(daily_record.comment, recorded_on, habit_daily_records);

            Ok(daily_record)
        }
        None => {
            let habits = query!(
                "
                select id, name from habits
                where user_id = $1
                and (archived_at is null or archived_at > $2)
                and created_at < $3
                order by created_at
                ",
                user_id.clone(),
                start_of_date(recorded_on),
                end_of_date(recorded_on)
            )
            .fetch_all(pool)
            .await?;

            let habit_daily_records: Vec<HabitDailyRecordDto> = habits
                .into_iter()
                .map(|v| HabitDailyRecordDto::new(false, v.id, v.name))
                .collect();

            let daily_record = DailyRecordDto::new("".into(), recorded_on, habit_daily_records);

            Ok(daily_record)
        }
    }
}
