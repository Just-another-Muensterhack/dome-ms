from django.db import migrations, models


def name_existing_contents(apps, schema_editor):
    # number the existing versions of each website in the order they were created
    WebsiteContent = apps.get_model('website', 'WebsiteContent')
    numbers = {}
    contents = list(WebsiteContent.objects.order_by('website_id', 'created_at'))
    for content in contents:
        numbers[content.website_id] = numbers.get(content.website_id, 0) + 1
        content.name = f'Version {numbers[content.website_id]}'
    WebsiteContent.objects.bulk_update(contents, ['name'])


class Migration(migrations.Migration):

    dependencies = [
        ('website', '0003_content_versions'),
    ]

    operations = [
        migrations.AddField(
            model_name='websitecontent',
            name='name',
            field=models.CharField(default='', help_text="Identifies the version to the user, e.g. 'Version 3'.", max_length=255),
            preserve_default=False,
        ),
        migrations.RunPython(name_existing_contents, migrations.RunPython.noop),
    ]
